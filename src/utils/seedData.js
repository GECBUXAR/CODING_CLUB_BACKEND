import Faculty from "../models/faculty.model.js";
import mongoose from "mongoose";

const seedFacultys = async () => {
  try {
    const count = await Faculty.countDocuments();

    // Only seed if no Facultys exist
    if (count === 0) {
      const facultyData = [
        {
          name: "Dr. Rajesh Kumar",
          role: "Professor, Computer Science",
          content:
            "The Coding Club has transformed how our students approach problem-solving. The initiatives taken by the club have significantly improved participation in competitive programming.",
          rating: 5,
          image: "https://randomuser.me/api/portraits/men/1.jpg",
          isActive: true,
        },
        {
          name: "Priya Sharma",
          role: "Final Year Student",
          content:
            "Joining the Coding Club was the best decision I made in college. The mentorship and practice sessions helped me land a job at a top tech company.",
          rating: 5,
          image: "https://randomuser.me/api/portraits/women/2.jpg",
          isActive: true,
        },
        {
          name: "Arjun Mehta",
          role: "Industry Partner",
          content:
            "We've been hiring from this college specifically because of how well-prepared the Coding Club members are. They have practical skills that are immediately applicable in the industry.",
          rating: 5,
          image: "https://randomuser.me/api/portraits/men/3.jpg",
          isActive: true,
        },
        {
          name: "Dr. Sunita Patel",
          role: "Head of Department",
          content:
            "The Coding Club's workshops and events have brought a new energy to our department. Students are more engaged and passionate about programming than ever before.",
          rating: 5,
          image: "https://randomuser.me/api/portraits/women/4.jpg",
          isActive: true,
        },
      ];

      await Faculty.insertMany(facultyData);
      console.log("Facultys seeded successfully!");
    } else {
      console.log("Facultys already exist, skipping seed.");
    }
  } catch (error) {
    console.error("Error seeding Facultys:", error);
  }
};

export { seedFacultys };
