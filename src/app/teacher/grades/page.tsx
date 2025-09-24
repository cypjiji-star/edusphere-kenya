
"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  FileText,
  Loader2,
  CalendarIcon,
  PlusCircle,
  Archive,
  ArchiveRestore,
  Send,
} from "lucide-react";
import { firestore } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
} from "firebase/firestore";
import { useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { saveGradesAction } from "./actions";
import { Combobox } from "@/components/ui/combobox";
import { useAuth } from "@/context/auth-context";

type Student = {
  id: string;
  name: string;
  avatarUrl: string;
  grades?: Record<string, string>; // { [subjectName]: grade }
  average?: number;
  rank?: number;
};

type TeacherClass = {
  id: string;
  name: string;
};

type Subject = {
  id: string;
  name: string;
};

type Exam = {
  id: string;
  title: string;
  term: string;
  date: Timestamp;
  status: "Open" | "Closed";
};

type GradeRecord = {
  studentId: string;
  subject: string;
  grade: string;
  examId: string;
};

export default function TeacherGradesPage() {
  const searchParams = useSearchParams();
  const schoolId = searchParams.get("schoolId");
  const { user } = useAuth();
  const { toast } = useToast();

  const [allClasses, setAllClasses] = React.useState<TeacherClass[]>([]);
  const [allSubjects, setAllSubjects] = React.useState<Subject[]>([]);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [openExams, setOpenExams] = React.useState<Exam[]>([]);
  const [archivedExams, setArchivedExams] = React.useState<Exam[]>([]);

  // State for Grade Entry
  const [selectedClassId, setSelectedClassId] = React.useState<string>("");
  const [selectedSubject, setSelectedSubject] = React.useState<string>("");
  const [selectedExamId, setSelectedExamId] = React.useState<string>("");
  const [grades, setGrades] = React.useState<
    Record<string, { grade: string; studentName: string }>
  >({});

  // State for Exam Archives
  const [rankingExamId, setRankingExamId] = React.useState<string>("");
  const [rankedStudentsByClass, setRankedStudentsByClass] = React.useState<
    Record<string, Student[]>
  >({});
  const [rankingSubjects, setRankingSubjects] = React.useState<string[]>([]);
  const [isRankingLoading, setIsRankingLoading] = React.useState(false);

  const [isLoading, setIsLoading] = React.useState({
    classes: true,
    subjects: true,
    students: false,
    exams: true,
  });
  const [isSaving, setIsSaving] = React.useState(false);

  // Fetch teacher's classes, subjects, and exams
  React.useEffect(() => {
    if (!schoolId || !user) return;
    const teacherId = user.uid;
    const teacherName = user.displayName;

    const classesQuery = query(
      collection(firestore, `schools/${schoolId}/classes`),
      where("teacherId", "==", teacherId),
    );
    const unsubClasses = onSnapshot(classesQuery, (snapshot) => {
      const classesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: `${doc.data().name} ${doc.data().stream || ""}`.trim(),
      }));
      setAllClasses(classesData);
      setIsLoading((prev) => ({ ...prev, classes: false }));
    });

    const subjectsQuery = query(
      collection(firestore, `schools/${schoolId}/subjects`),
      where("teachers", "array-contains", teacherName),
    );
    const unsubSubjects = onSnapshot(subjectsQuery, (snapshot) => {
      setAllSubjects(
        snapshot.docs.map(
          (doc) => ({ id: doc.id, name: doc.data().name }) as Subject,
        ),
      );
      setIsLoading((prev) => ({ ...prev, subjects: false }));
    });

    const openExamsQuery = query(
      collection(firestore, `schools/${schoolId}/exams`),
      where("status", "==", "Open"),
      orderBy("date", "desc"),
    );
    const unsubOpenExams = onSnapshot(openExamsQuery, (snapshot) => {
      setOpenExams(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Exam),
      );
      setIsLoading((prev) => ({ ...prev, exams: false }));
    });

    const archivedExamsQuery = query(
      collection(firestore, `schools/${schoolId}/exams`),
      where("status", "==", "Closed"),
      orderBy("date", "desc"),
    );
    const unsubArchivedExams = onSnapshot(archivedExamsQuery, (snapshot) => {
      setArchivedExams(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Exam),
      );
    });

    return () => {
      unsubClasses();
      unsubSubjects();
      unsubOpenExams();
      unsubArchivedExams();
    };
  }, [schoolId, user]);

  const fetchStudentsAndGrades = React.useCallback(async () => {
    if (!selectedClassId || !selectedSubject || !selectedExamId || !schoolId) {
      setStudents([]);
      return;
    }

    setIsLoading((prev) => ({ ...prev, students: true }));
    try {
      const studentsQuery = query(
        collection(firestore, "schools", schoolId, "users"),
        where("role", "==", "Student"),
        where("classId", "==", selectedClassId),
        orderBy("name"),
      );
      const studentsSnapshot = await getDocs(studentsQuery);
      const studentList: Student[] = studentsSnapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || "Unknown",
          avatarUrl:
            data.avatarUrl || `https://picsum.photos/seed/${d.id}/100`,
        } as Student;
      });

      const gradesQuery = query(
        collection(firestore, `schools/${schoolId}/grades`),
        where("classId", "==", selectedClassId),
        where("subject", "==", selectedSubject),
        where("examId", "==", selectedExamId),
      );
      const gradesSnapshot = await getDocs(gradesQuery);
      const gradesMap = new Map<string, string>();
      gradesSnapshot.forEach((doc) => {
        const data = doc.data();
        gradesMap.set(data.studentId, data.grade);
      });

      const initialGrades: Record<string, { grade: string; studentName: string }> = {};
      studentList.forEach(student => {
        if (gradesMap.has(student.id)) {
          initialGrades[student.id] = { grade: gradesMap.get(student.id)!, studentName: student.name };
        }
      });
      setGrades(initialGrades);
      setStudents(studentList);
    } catch (error) {
      console.error("Failed to fetch students and grades:", error);
      toast({
        title: "Error",
        description: "Could not load students and their existing grades.",
        variant: "destructive",
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, students: false }));
    }
  }, [selectedClassId, selectedSubject, selectedExamId, schoolId, toast]);


  // Fetch students when class/subject/exam selection changes
  React.useEffect(() => {
    fetchStudentsAndGrades();
    setGrades({}); // Reset grades when context changes
  }, [selectedClassId, selectedSubject, selectedExamId, fetchStudentsAndGrades]);

  // Fetch and compute rankings for all teacher's classes for the selected archived exam
  React.useEffect(() => {
    if (!rankingExamId || !schoolId || allClasses.length === 0) {
      setRankedStudentsByClass({});
      return;
    }

    setIsRankingLoading(true);

    const fetchAllRankings = async () => {
      const studentsByClass: Record<string, Student[]> = {};
      const classIds = allClasses.map((c) => c.id);

      const studentQuery = query(
        collection(firestore, `schools/${schoolId}/users`),
        where("role", "==", "Student"),
        where("classId", "in", classIds),
      );
      const studentSnap = await getDocs(studentQuery);
      studentSnap.forEach((doc) => {
        const data = doc.data();
        if (!studentsByClass[data.classId]) {
          studentsByClass[data.classId] = [];
        }
        studentsByClass[data.classId].push({
          id: doc.id,
          name: data.name,
          avatarUrl:
            data.avatarUrl || `https://picsum.photos/seed/${doc.id}/100`,
          grades: {},
        });
      });

      const gradesQuery = query(
        collection(firestore, `schools/${schoolId}/grades`),
        where("examId", "==", rankingExamId),
        where("status", "in", ["Approved", "Pending Approval"]),
      );
      const gradesSnapshot = await getDocs(gradesQuery);
      const gradesData: GradeRecord[] = gradesSnapshot.docs.map(
        (d) => d.data() as GradeRecord,
      );
      const allSubjectsInView = new Set<string>();

      const newRankedData: Record<string, Student[]> = {};

      for (const classId in studentsByClass) {
        const studentsInClass = studentsByClass[classId];
        if (studentsInClass.length === 0) continue;

        const studentsWithGrades = studentsInClass.map((student) => {
          const studentGrades: Record<string, string> = {};
          gradesData.forEach((grade) => {
            if (grade.studentId === student.id) {
              studentGrades[grade.subject] = grade.grade;
              allSubjectsInView.add(grade.subject);
            }
          });
          const numericGrades = Object.values(studentGrades)
            .map((g) => parseInt(g, 10))
            .filter((g) => !isNaN(g));
          const average =
            numericGrades.length > 0
              ? Math.round(
                  numericGrades.reduce((a, b) => a + b, 0) /
                    numericGrades.length,
                )
              : 0;
          return { ...student, grades: studentGrades, average };
        });

        studentsWithGrades.sort((a, b) => (b.average || 0) - (a.average || 0));

        newRankedData[classId] = studentsWithGrades.map((student, index) => ({
          ...student,
          rank: index + 1,
        }));
      }

      setRankedStudentsByClass(newRankedData);
      setRankingSubjects(Array.from(allSubjectsInView).sort());
      setIsRankingLoading(false);
    };

    fetchAllRankings();
  }, [rankingExamId, schoolId, allClasses]);

  const handleGradeChange = (
    studentId: string,
    studentName: string,
    grade: string,
  ) => {
    setGrades((prev) => ({
      ...prev,
      [studentId]: { grade, studentName },
    }));
  };

  const handleSaveGrades = async () => {
    if (
      !selectedClassId ||
      !selectedSubject ||
      !selectedExamId ||
      Object.keys(grades).length === 0 ||
      !user
    ) {
      toast({
        title: "Missing Information",
        description:
          "Please select a class, subject, exam, and enter at least one grade.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    const result = await saveGradesAction(
      schoolId!,
      selectedClassId,
      selectedSubject,
      selectedExamId,
      grades,
      { id: user.uid, name: user.displayName || "Teacher" },
    );

    if (result.success) {
      toast({ title: "Grades Submitted", description: result.message });
      setGrades({}); // Clear form after successful save
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    }
    setIsSaving(false);
  };

  const canShowTable = selectedClassId && selectedSubject && selectedExamId;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8 text-primary" />
          Grades & Exams
        </h1>
        <p className="text-muted-foreground">
          Enter student grades and review exam history.
        </p>
      </div>

      <Tabs defaultValue="entry">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="entry">Grade Entry</TabsTrigger>
          <TabsTrigger value="archives">Exam Archives</TabsTrigger>
        </TabsList>
        <TabsContent value="entry" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Details</CardTitle>
              <CardDescription>
                Choose a class, subject, and exam to begin entering grades.
              </CardDescription>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Combobox
                    options={allClasses.map((c) => ({
                      value: c.id,
                      label: c.name,
                    }))}
                    value={selectedClassId}
                    onValueChange={setSelectedClassId}
                    placeholder="Select a class..."
                    disabled={isLoading.classes}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Combobox
                    options={allSubjects.map((s) => ({
                      value: s.name,
                      label: s.name,
                    }))}
                    value={selectedSubject}
                    onValueChange={setSelectedSubject}
                    placeholder="Select a subject..."
                    disabled={isLoading.subjects}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Exam</Label>
                  <Combobox
                    options={openExams.map((e) => ({
                      value: e.id,
                      label: e.title,
                    }))}
                    value={selectedExamId}
                    onValueChange={setSelectedExamId}
                    placeholder="Select an exam..."
                    disabled={isLoading.exams}
                  />
                </div>
              </div>
            </CardHeader>
            {canShowTable && (
              <>
                <CardContent>
                  {isLoading.students ? (
                    <div className="flex h-64 items-center justify-center">
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="w-full overflow-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead className="w-48">
                              Grade/Score (%)
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {students.length > 0 ? (
                            students.map((student) => (
                              <TableRow key={student.id}>
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-9 w-9">
                                      <AvatarImage src={student.avatarUrl} />
                                      <AvatarFallback>
                                        {student.name?.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    {student.name}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    placeholder="Enter grade"
                                    max="100"
                                    min="0"
                                    value={grades[student.id]?.grade || ""}
                                    onChange={(e) =>
                                      handleGradeChange(
                                        student.id,
                                        student.name,
                                        e.target.value,
                                      )
                                    }
                                  />
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={2}
                                className="h-24 text-center text-muted-foreground"
                              >
                                No students found in this class.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button onClick={handleSaveGrades} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Grades
                  </Button>
                </CardFooter>
              </>
            )}
          </Card>
        </TabsContent>
        <TabsContent value="archives" className="mt-4">
          <Card>
            <CardHeader>
              <div className="space-y-2">
                <Label>Select an Exam to View History</Label>
                <Combobox
                  options={archivedExams.map((e) => ({
                    value: e.id,
                    label: e.title,
                  }))}
                  value={rankingExamId}
                  onValueChange={setRankingExamId}
                  placeholder="Select an archived exam..."
                  disabled={isLoading.exams}
                />
              </div>
            </CardHeader>
            <CardContent>
              {isRankingLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              ) : !rankingExamId ? (
                <div className="text-center py-16 text-muted-foreground">
                  Please select an archived exam to view class rankings.
                </div>
              ) : (
                <Accordion type="single" collapsible className="w-full">
                  {allClasses.map((c) => {
                    const rankedStudents = rankedStudentsByClass[c.id] || [];
                    return (
                      <AccordionItem value={c.id} key={c.id}>
                        <AccordionTrigger className="text-lg font-semibold">
                          {c.name}
                        </AccordionTrigger>
                        <AccordionContent>
                          {rankedStudents.length > 0 ? (
                            <div className="w-full overflow-auto rounded-lg border">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Rank</TableHead>
                                    <TableHead>Student</TableHead>
                                    {rankingSubjects.map((subject) => (
                                      <TableHead
                                        key={subject}
                                        className="text-center"
                                      >
                                        {subject}
                                      </TableHead>
                                    ))}
                                    <TableHead className="text-right font-bold">
                                      Average
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {rankedStudents.map((student) => (
                                    <TableRow key={student.id}>
                                      <TableCell className="font-bold text-lg text-center">
                                        {student.rank}
                                      </TableCell>
                                      <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                          <Avatar className="h-9 w-9">
                                            <AvatarFallback>
                                              {student.name?.charAt(0)}
                                            </AvatarFallback>
                                          </Avatar>
                                          {student.name}
                                        </div>
                                      </TableCell>
                                      {rankingSubjects.map((subject) => (
                                        <TableCell
                                          key={subject}
                                          className="text-center font-semibold"
                                        >
                                          {student.grades?.[subject] || "—"}
                                        </TableCell>
                                      ))}
                                      <TableCell className="text-right font-extrabold text-primary">
                                        {student.average?.toFixed(1)}%
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          ) : (
                            <div className="text-center text-muted-foreground py-8">
                              No grades found for this class for the selected
                              exam.
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
