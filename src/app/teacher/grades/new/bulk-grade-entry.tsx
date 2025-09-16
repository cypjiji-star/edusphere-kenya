
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { FileDown, Upload, FileCheck2, Loader2, AlertCircle, CheckCircle, Columns, X, FileText } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { collection, onSnapshot, query, where, getDocs, writeBatch, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { firestore, auth } from '@/lib/firebase';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { saveGradesAction } from '../actions';
import type { GradeEntryFormValues } from '../types';


type TeacherClass = {
  id: string;
  name: string;
};

type Assessment = {
  id: string;
  title: string;
  subject: string;
};

type StudentData = {
    id: string;
    name: string;
    admissionNumber: string;
};

type ValidationResult = {
  student: string;
  admissionNumber: string;
  grade: string;
  status: 'Success' | 'Error';
  message: string;
  studentId?: string;
};

export function BulkGradeEntry() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const { user } = useAuth();
  
  const [teacherClasses, setTeacherClasses] = React.useState<TeacherClass[]>([]);
  const [assessments, setAssessments] = React.useState<Assessment[]>([]);
  const [selectedClassId, setSelectedClassId] = React.useState<string>('');
  const [selectedAssessmentId, setSelectedAssessmentId] = React.useState<string>('');
  const [bulkGradeFile, setBulkGradeFile] = React.useState<File | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isFileProcessed, setIsFileProcessed] = React.useState(false);
  const [validationResults, setValidationResults] = React.useState<ValidationResult[]>([]);
  const [isImporting, setIsImporting] = React.useState(false);

  React.useEffect(() => {
    if (!schoolId || !user) return;
    const teacherId = user.uid;
    
    const classesQuery = query(collection(firestore, `schools/${schoolId}/classes`), where('teacherId', '==', teacherId));
    const unsubClasses = onSnapshot(classesQuery, (snapshot) => {
        const classesData = snapshot.docs.map(doc => ({ id: doc.id, name: `${doc.data().name} ${doc.data().stream || ''}`.trim() }));
        setTeacherClasses(classesData);
    });

    return () => unsubClasses();
  }, [schoolId, user]);
  
  React.useEffect(() => {
    if (!selectedClassId || !schoolId) {
        setAssessments([]);
        return;
    };
    const assessmentsQuery = query(collection(firestore, `schools/${schoolId}/assessments`), where('classId', '==', selectedClassId));
    const unsubAssessments = onSnapshot(assessmentsQuery, (snapshot) => {
        const assessmentData = snapshot.docs.map(doc => ({ id: doc.id, title: doc.data().title, subject: doc.data().subject }));
        setAssessments(assessmentData);
    });
    return () => unsubAssessments();
  }, [selectedClassId, schoolId]);

  const handleDownloadTemplate = async () => {
    if (!selectedClassId || !selectedAssessmentId) {
      toast({
        title: 'Selection Required',
        description: 'Please select a class and an assessment first.',
        variant: 'destructive',
      });
      return;
    }
    
    const studentsQuery = query(
      collection(firestore, `schools/${schoolId}/students`),
      where('classId', '==', selectedClassId)
    );
    const studentsSnapshot = await getDocs(studentsQuery);
    const students: StudentData[] = studentsSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      admissionNumber: doc.data().admissionNumber,
    }));

    const assessment = assessments.find(a => a.id === selectedAssessmentId);
    const className = teacherClasses.find(c => c.id === selectedClassId)?.name;

    let csvContent = 'student_id,admission_number,student_name,grade\n';
    students.forEach(student => {
      csvContent += `${student.id},${student.admissionNumber},"${student.name}",\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${className}_${assessment?.title}_grades.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Template Downloading',
      description: 'Your CSV template is being prepared.',
    });
  };
  
  const handleBulkFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setBulkGradeFile(event.target.files[0]);
      setIsFileProcessed(false);
      setValidationResults([]);
    }
  };

  const handleProcessFile = async () => {
    if (!bulkGradeFile) return;
    setIsProcessing(true);

    const studentsQuery = query(
      collection(firestore, `schools/${schoolId}/students`),
      where('classId', '==', selectedClassId)
    );
    const studentsSnapshot = await getDocs(studentsQuery);
    const classStudents: StudentData[] = studentsSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      admissionNumber: doc.data().admissionNumber,
    }));

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvData = event.target?.result as string;
      const lines = csvData.split('\n').slice(1); // Skip header
      const results: ValidationResult[] = [];
      
      lines.forEach(line => {
        if (!line.trim()) return;
        const [studentId, admNo, name, grade] = line.split(',');
        const student = classStudents.find(s => s.id === studentId.trim() || s.admissionNumber === admNo.trim());

        if (!student) {
            results.push({ student: name, admissionNumber: admNo, grade, status: 'Error', message: 'Student not found in this class.' });
        } else {
            const score = Number(grade);
            if (isNaN(score)) {
                results.push({ student: student.name, admissionNumber: student.admissionNumber, grade, status: 'Error', message: 'Grade is not a valid number.' });
            } else if (score < 0 || score > 100) {
                results.push({ student: student.name, admissionNumber: student.admissionNumber, grade, status: 'Error', message: `Grade ${score} is out of range (0-100).` });
            } else {
                results.push({ student: student.name, admissionNumber: student.admissionNumber, grade, status: 'Success', message: 'Ready for import.', studentId: student.id });
            }
        }
      });
      
      setValidationResults(results);
      setIsFileProcessed(true);
      toast({
        title: 'File Processed & Validated',
        description: 'Review the validation results before importing.',
      });
      setIsProcessing(false);
    };
    reader.readAsText(bulkGradeFile);
  };
  
  const handleImportGrades = async () => {
    if (!user) {
        toast({variant: 'destructive', title: 'Authentication Error'});
        return;
    }
    const validGrades = validationResults.filter(r => r.status === 'Success');
    if (validGrades.length === 0) {
        toast({ title: 'No Valid Grades to Import', variant: 'destructive'});
        return;
    }

    const assessment = assessments.find(a => a.id === selectedAssessmentId);
    if (!assessment) {
        toast({ title: 'Assessment not found!', variant: 'destructive'});
        return;
    }

    setIsImporting(true);

    const gradeData: GradeEntryFormValues = {
        classId: selectedClassId,
        subject: assessment.subject,
        assessmentId: selectedAssessmentId,
        grades: validGrades.map(g => ({ studentId: g.studentId!, grade: g.grade })),
    };

    const result = await saveGradesAction(schoolId!, user.uid, user.displayName || 'Teacher', gradeData);

    if (result.success) {
        toast({
            title: 'Import Complete',
            description: `${validGrades.length} grades have been successfully imported.`,
        });
        setBulkGradeFile(null);
        setIsFileProcessed(false);
        setValidationResults([]);
    } else {
        toast({ title: 'Import Failed', description: result.message, variant: 'destructive' });
    }
    setIsImporting(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
            <Label htmlFor="class-select-bulk">Class</Label>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger id="class-select-bulk"><SelectValue placeholder="Select a class" /></SelectTrigger>
                <SelectContent>{teacherClasses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
        </div>
        <div className="space-y-2">
            <Label htmlFor="assessment-select-bulk">Assessment</Label>
            <Select value={selectedAssessmentId} onValueChange={setSelectedAssessmentId} disabled={!selectedClassId}>
                <SelectTrigger id="assessment-select-bulk"><SelectValue placeholder="Select an assessment" /></SelectTrigger>
                <SelectContent>{assessments.map(a => <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>)}</SelectContent>
            </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Step 1: Download & Fill Template</Label>
        <Button onClick={handleDownloadTemplate} variant="outline" disabled={!selectedClassId || !selectedAssessmentId}>
          <FileDown className="mr-2 h-4 w-4"/>
          Download CSV Template
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Step 2: Upload Completed File</Label>
        {bulkGradeFile ? (
             <div className="w-full p-4 rounded-lg border bg-muted/50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="truncate">{bulkGradeFile.name}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setBulkGradeFile(null)} className="h-6 w-6">
                    <X className="h-4 w-4 text-destructive" />
                </Button>
            </div>
        ) : (
            <Label htmlFor="dropzone-file-bulk" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                    <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">Click to upload or drag and drop your file</p>
                </div>
                <Input id="dropzone-file-bulk" type="file" className="hidden" onChange={handleBulkFileChange} accept=".csv" />
            </Label>
        )}
      </div>
      
      <Button onClick={handleProcessFile} disabled={!bulkGradeFile || isProcessing || isFileProcessed}>
        {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Validating...</> : <><FileCheck2 className="mr-2 h-4 w-4"/> Validate & Preview</>}
      </Button>

      {isFileProcessed && (
        <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
                <Columns className="h-5 w-5 text-primary"/>
                Validation Results
            </h3>
            <Card>
                <CardContent className="p-0">
                    <div className="w-full overflow-auto rounded-lg border max-h-60">
                        <table className="w-full">
                            <thead className="bg-muted/50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-left text-sm font-medium">Student</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium">Grade</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium">Status</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium">Message</th>
                                </tr>
                            </thead>
                            <tbody>
                                {validationResults.map((result, index) => (
                                    <tr key={index} className="border-b">
                                        <td className="p-2 text-sm font-medium">{result.student}</td>
                                        <td className="p-2 text-sm">{result.grade}</td>
                                        <td className="p-2 text-sm">
                                            {result.status === 'Success' ? 
                                                <Badge className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3"/>Success</Badge> : 
                                                <Badge variant="destructive"><AlertCircle className="mr-1 h-3 w-3"/>Error</Badge>
                                            }
                                        </td>
                                        <td className="p-2 text-sm text-muted-foreground">{result.message}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
            <Button onClick={handleImportGrades} disabled={isImporting || validationResults.filter(r => r.status === 'Success').length === 0}>
                {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4"/>}
                Import Validated Grades
            </Button>
        </div>
      )}
    </div>
  );
}
