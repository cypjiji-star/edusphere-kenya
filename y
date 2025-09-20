{
  "indexes": [
    {
      "collectionGroup": "announcements",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "sender.id",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "sentAt",
          "order": "DESCENDING"
        }
      ],
      "density": "SPARSE_ALL"
    },
    {
      "collectionGroup": "announcements",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "sender.name",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "sentAt",
          "order": "DESCENDING"
        }
      ],
      "density": "SPARSE_ALL"
    },
    {
      "collectionGroup": "assessments",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "startDate",
          "order": "DESCENDING"
        },
        {
          "fieldPath": "status",
          "order": "DESCENDING"
        }
      ],
      "density": "SPARSE_ALL"
    },
    {
      "collectionGroup": "assessments",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "startDate",
          "order": "DESCENDING"
        }
      ],
      "density": "SPARSE_ALL"
    },
    {
      "collectionGroup": "attendance",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "classId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "date",
          "order": "ASCENDING"
        }
      ],
      "density": "SPARSE_ALL"
    },
    {
      "collectionGroup": "attendance",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "status",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "teacherId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "date",
          "order": "ASCENDING"
        }
      ],
      "density": "SPARSE_ALL"
    },
    {
      "collectionGroup": "attendance",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "studentId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "date",
          "order": "ASCENDING"
        }
      ],
      "density": "SPARSE_ALL"
    },
    {
      "collectionGroup": "attendance",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "studentId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "date",
          "order": "DESCENDING"
        }
      ],
      "density": "SPARSE_ALL"
    },
    {
      "collectionGroup": "attendance",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "teacherId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "date",
          "order": "ASCENDING"
        }
      ],
      "density": "SPARSE_ALL"
    },
    {
      "collectionGroup": "audit_logs",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "action",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "timestamp",
          "order": "DESCENDING"
        }
      ],
      "density": "SPARSE_ALL"
    },
    {
      "collectionGroup": "audit_logs",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "actionType",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "timestamp",
          "order": "DESCENDING"
        }
      ],
      "density": "SPARSE_ALL"
    },
    {
      "collectionGroup": "conversations",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "participants",
          "arrayConfig": "CONTAINS"
        },
        {
          "fieldPath": "timestamp",
          "order": "DESCENDING"
        }
      ],
      "density": "SPARSE_ALL"
    },
    {
      "collectionGroup": "grades",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "studentId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "date",
          "order": "DESCENDING"
        }
      ],
      "density": "SPARSE_ALL"
    },
    {
      "collectionGroup": "incidents",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "reportedById",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "date",
          "order": "DESCENDING"
        }
      ],
      "density": "SPARSE_ALL"
    },
    {
      "collectionGroup": "incidents",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "studentId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "date",
          "order": "DESCENDING"
        }
      ],
      "density": "SPARSE_ALL"
    },
    {
      "collectionGroup": "leave-applications",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "teacherId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "startDate",
          "order": "DESCENDING"
        }
      ],
      "density": "SPARSE_ALL"
    },
    {
      "collectionGroup": "medications",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "studentId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "date",
          "order": "DESCENDING"
        }
      ],
      "density": "SPARSE_ALL"
    },
    {
      "collectionGroup": "mini_payments",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "teacherId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "recordedAt",
          "order": "DESCENDING"
        }
      ],
      "density": "SPARSE_ALL"
    },
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "audience",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ],
      "density": "SPARSE_ALL"
    },
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ],
      "density": "SPARSE_ALL"
    },
    {
      "collectionGroup": "students",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "classId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "name",
          "order": "ASCENDING"
        }
      ],
      "density": "SPARSE_ALL"
    },
    {
      "collectionGroup": "students",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "classId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "rollNumber",
          "order": "ASCENDING"
        }
      ],
      "density": "SPARSE_ALL"
    },
    {
      "collectionGroup": "support-chats",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "isEscalated",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "lastUpdate",
          "order": "DESCENDING"
        }
      ],
      "density": "SPARSE_ALL"
    },
    {
      "collectionGroup": "support-tickets",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "user.id",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "lastUpdate",
          "order": "DESCENDING"
        }
      ],
      "density": "SPARSE_ALL"
    },
    {
      "collectionGroup": "teacher_attendance",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "teacherId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "date",
          "order": "ASCENDING"
        }
      ],
      "density": "SPARSE_ALL"
    },
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "type",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "date",
          "order": "ASCENDING"
        }
      ],
      "density": "SPARSE_ALL"
    }
  ],
  "fieldOverrides": [
    {
      "collectionGroup": "attendance",
      "fieldPath": "schoolId",
      "ttl": false,
      "indexes": [
        {
          "order": "ASCENDING",
          "queryScope": "COLLECTION"
        },
        {
          "order": "DESCENDING",
          "queryScope": "COLLECTION"
        },
        {
          "arrayConfig": "CONTAINS",
          "queryScope": "COLLECTION"
        },
        {
          "order": "ASCENDING",
          "queryScope": "COLLECTION_GROUP"
        }
      ]
    },
    {
      "collectionGroup": "records",
      "fieldPath": "schoolId",
      "ttl": false,
      "indexes": [
        {
          "order": "ASCENDING",
          "queryScope": "COLLECTION"
        },
        {
          "order": "DESCENDING",
          "queryScope": "COLLECTION"
        },
        {
          "arrayConfig": "CONTAINS",
          "queryScope": "COLLECTION"
        },
        {
          "order": "ASCENDING",
          "queryScope": "COLLECTION_GROUP"
        }
      ]
    },
    {
      "collectionGroup": "transactions",
      "fieldPath": "date",
      "ttl": false,
      "indexes": [
        {
          "order": "ASCENDING",
          "queryScope": "COLLECTION"
        },
        {
          "order": "DESCENDING",
          "queryScope": "COLLECTION"
        },
        {
          "arrayConfig": "CONTAINS",
          "queryScope": "COLLECTION"
        },
        {
          "order": "DESCENDING",
          "queryScope": "COLLECTION_GROUP"
        }
      ]
    }
  ]
}