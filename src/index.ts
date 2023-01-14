import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

import { PrismaClient }  from "@prisma/client";

const prisma = new PrismaClient();

// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const typeDefs = `#graphql
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  # This "Book" type defines the queryable fields for every book in our data source.
  # type Book {
  #   title: String
  #   author: String
  # }

  # The "Query" type is special: it lists all of the available queries that
  # clients can execute, along with the return type for each. In this
  # case, the "books" query returns an array of zero or more Books (defined above).
  # type Query {
  #   books: [Book]
  # }

  type Student {
    id: ID!
    email: String!
    fullName: String!
    dept: Department!
    enrolled: Boolean
    updatedAt: String
    createdAt: String
  }

  type Department {
    id: ID!
    name: String!
    description: String
    students: [Student]
    courses: [Course]
    updatedAt: String
    createdAt: String
  }

  type Teacher {
    id: ID!
    email: String!
    fullName: String!
    courses: [Course]
    type: TeacherType
    updatedAt: String
    createdAt: String
  }

  type Course {
    id: ID!
    code: String!
    title: String!
    description: String
    teacher: Teacher
    dept: Department
    updatedAt: String
    createdAt: String
  }

  input TeacherCreateInput {
    email: String!
    fullName: String!
    courses: [CourseCreateWithoutTeacherInput!]
  }

  input CourseCreateWithoutTeacherInput {
    code: String!
    title: String!
    description: String
  }

  type Query {
    enrollment: [Student!]
    students: [Student!]
    student(id: ID!): Student
    departments: [Department!]!
    department(id: ID!): Department
    courses: [Course!]!
    course(id: ID!): Course
    teachers: [Teacher!]!
    teacher(id: ID!): Teacher
  }

  type Mutation {
    registerStudent(email: String!, fullName: String!, deptId: Int!): Student!
    enroll(id: ID!): Student
    createTeacher(data: TeacherCreateInput!): Teacher!
    createCourse(code: String!, title: String!, teacherEmail: String): Course!
    createDepartment(name: String!, description: String): Department!
  }

enum TeacherType {
  FULLTIME
  PARTTIME
}

`;

// Queries
const Query = {
  // find enrolled students
  enrollment: (parent, args) => {
    return prisma.student.findMany({
      where: { enrolled: true },
    });
  },

  // find a student with an id
  student: (parent, args) => {
    return prisma.student.findFirst({
      where: { id: Number(args.id) },
    });
  },

  // find all students
  students: (parent, args) => {
    return prisma.student.findMany({});
  },


  // find all departments
  departments: (parent, args) => {
    return prisma.department.findMany({});
  },

  // find a department with an id
  department: (parent, args) => {
    return prisma.department.findFirst({
      where: { id: Number(args.id) },
    });
  },

  // find all courses
  courses: (parent, args) => {
    return prisma.course.findMany({});
  },

  // find a course with an id
  course: (parent, args) => {
    return prisma.course.findFirst({
      where: { id: Number(args.id) },
    });
  },

  // find all teachers
  teachers: (parent, args) => {
    return prisma.teacher.findMany({});
  },

  // find a teacher with an id
  teacher: (parent, args) => {
    return prisma.teacher.findFirst({
      where: { id: Number(args.id) },
    });
  },
};

// Mutations
const Mutation = {
  registerStudent: (parent, args) => {
    return prisma.student.create({
      data: {
        email: args.email,
        fullName: args.fullName,
        dept: args.deptId && {
          connect: { id: args.deptId },
        },
      },
    });
  },
  enroll: (parent, args) => {
    return prisma.student.update({
      where: { id: Number(args.id) },
      data: {
        enrolled: true,
      },
    });
  },

  createTeacher: (parent, args) => {
    return prisma.teacher.create({
      data: {
        email: args.data.email,
        fullName: args.data.fullName,
        courses: {
          create: args.data.courses,
        },
      },
    });
  },

  createCourse: (parent, args) => {
    console.log(parent, args);
    return prisma.course.create({
      data: {
        code: args.code,
        title: args.title,
        teacher: args.teacherEmail && {
          connect: { email: args.teacherEmail },
        },
      },
    });
  },

  createDepartment: (parent, args) => {
    return prisma.department.create({
      data: {
        name: args.name,
        description: args.description,
      },
    });
  },
};

// Resolvers
const Student = {
  id: (parent, args, context, info) => parent.id,
  email: (parent) => parent.email,
  fullName: (parent) => parent.fullName,
  enrolled: (parent) => parent.enrolled,
  dept: (parent, args) => {
    return prisma.department.findFirst({
      where: { id: parent.dept },
    });
  },
};

const Department = {
  id: (parent) => parent.id,
  name: (parent) => parent.name,
  description: (parent) => parent.description,
  students: (parent, args) => {
    return prisma.department
      .findUnique({
        where: { id: parent.id },
      })
      .students();
  },
  courses: (parent, args) => {
    return prisma.department
      .findUnique({
        where: { id: parent.id },
      })
      .courses();
  },
};

const Teacher = {
  id: (parent) => parent.id,
  email: (parent) => parent.email,
  fullName: (parent) => parent.fullName,
  courses: (parent, args) => {
    return prisma.teacher
      .findUnique({
        where: { id: parent.id },
      })
      .courses();
  },
};

const Course = {
  id: (parent) => parent.id,
  code: (parent) => parent.code,
  title: (parent) => parent.title,
  description: (parent) => parent.description,
  teacher: (parent, args) => {
    return prisma.course
      .findUnique({
        where: { id: parent.id },
      })
      .teacher();
  },
  dept: (parent, args) => {
    return prisma.course
      .findUnique({
        where: { id: parent.id },
      })
      .dept();
  },
};

// const books = [
//   {
//     title: "The Awakening",
//     author: "Kate Chopin",
//   },
//   {
//     title: "City of Glass",
//     author: "Paul Auster",
//   },
// ];

// Resolvers define how to fetch the types defined in your schema.
// This resolver retrieves books from the "books" array above.
const resolvers = {
  // Query: {
  //   books: () => books,
  // },

  Student,
  Department,
  Teacher,
  Course,
  Query,
  Mutation,
};

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// Passing an ApolloServer instance to the `startStandaloneServer` function:
//  1. creates an Express app
//  2. installs your ApolloServer instance as middleware
//  3. prepares your app to handle incoming requests
const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`🚀  Server ready at: ${url}`);
