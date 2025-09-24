"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Phone, Users, History, FileText, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import React, { useEffect, useState } from "react";
import { firestore } from "@/lib/firebase";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import { useSearchParams } from "next/navigation";

type StudentData = {
  id: string;
  name: string;
  admissionNumber: string;
  class: string;
  avatarUrl: string;
  overallGrade: string;
  dateOfBirth: string;
  studentContact: string;
  guardian: {
    name: string;
    relationship: string;
    contact: string;
  };
};

export default function StudentProfilePage({
  params,
}: {
  params: { studentId: string };
}) {
  const { studentId } = params;
  const searchParams = useSearchParams();
  const schoolId = searchParams.get("schoolId");
  const [student, setStudent] = useState<StudentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [clientReady, setClientReady] = useState(false);

  useEffect(() => {
    setClientReady(true);
    if (schoolId && studentId) {
      const getStudentData = async () => {
        setIsLoading(true);
        const studentRef = doc(
          firestore,
          "schools",
          schoolId,
          "users",
          studentId,
        );
        const docSnap = await getDoc(studentRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const dob = data.dateOfBirth
            ? (data.dateOfBirth as Timestamp).toDate().toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : "N/A";

          setStudent({
            id: docSnap.id,
            name: data.name,
            admissionNumber: data.admissionNumber,
            class: data.class,
            avatarUrl:
              data.avatarUrl || `https://picsum.photos/seed/${docSnap.id}/100`,
            overallGrade: "78%", // Placeholder
            dateOfBirth: dob,
            studentContact: data.phone || "N/A",
            guardian: {
              name: data.parentName || "N/A",
              relationship: data.parentRelationship || "N/A",
              contact: data.parentPhone || "N/A",
            },
          });
        }
        setIsLoading(false);
      };
      getStudentData();
    }
  }, [studentId, schoolId]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Student not found</h1>
        <Button asChild variant="link">
          <Link href={`/teacher/students?schoolId=${schoolId}`}>
            <ArrowLeft className="mr-2" /> Back to Class Management
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <Button asChild variant="outline" size="sm">
          <Link href={`/teacher/students?schoolId=${schoolId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Class View
          </Link>
        </Button>
      </div>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1 space-y-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Avatar className="h-24 w-24 mx-auto mb-4">
                <AvatarImage src={student.avatarUrl} alt={student.name} />
                <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <h2 className="font-headline text-2xl font-bold">
                {student.name}
              </h2>
              <p className="text-muted-foreground">
                {student.admissionNumber} | {student.class}
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <Badge variant="secondary">
                  Overall Grade: {student.overallGrade}
                </Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="h-5 w-5 text-primary" />
                Attendance History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex min-h-[150px] items-center justify-center rounded-lg border-2 border-dashed border-muted">
                <div className="text-center p-4">
                  <h3 className="mt-2 text-sm font-medium text-muted-foreground">
                    Attendance Data Unavailable
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Full history will be shown here.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Student Information
              </CardTitle>
              <CardDescription>
                Basic personal and contact details for {student.name}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">
                    Date of Birth
                  </p>
                  <p>{clientReady ? student.dateOfBirth : ""}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">
                    Student Phone
                  </p>
                  <p>{student.studentContact}</p>
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold text-base mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary/80" />
                  Guardian Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">
                      Guardian Name
                    </p>
                    <p>{student.guardian.name}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">
                      Relationship
                    </p>
                    <p>{student.guardian.relationship}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">
                      Guardian Contact
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {student.guardian.contact}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button disabled>
                <FileText className="mr-2" />
                View Full Academic Profile
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
