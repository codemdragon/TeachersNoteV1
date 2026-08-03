# TeachersNoteV1 Web Application

TeachersNoteV1 is a modern, responsive digital classroom platform designed for teachers to organize subjects, topics, and learning materials (PDFs, images, YouTube videos), and for students to easily access content with class code authorization.

## Tech Stack
- **Frontend**: Vanilla HTML5, CSS3 (CSS Variables, Dark Mode, Glassmorphic Theme), ES6+ JavaScript.
- **Backend-as-a-Service**: Supabase (Database, Authentication).
- **Media Storage**: Cloudinary (Unsigned Preset PDF & Image uploads).
- **Hosting**: Vercel.

## Core Features

### 👩‍🏫 Teacher Dashboard
- Create & manage Subjects, Topics, and hierarchical Subtopics.
- Class Settings: Whitelist student email addresses with granular subject access control.
- Enforce registration start & end windows.
- Approve/Block student access in real-time.
- View document engagement analytics (view count & student list).
- Multi-teacher admin approval system.

### 👨‍🎓 Student Dashboard
- Join class via Code & Email verification.
- Browse authorized subjects & topics based on whitelist access.
- View materials (PDF web modal preview, inline YouTube video player).
- Track progress with completed read indicators.

### 🔍 Search & Media
- Persistent global search filtering across Subjects, Topics, Subtopics, and File Names.
- Auto-expansion of accordions on search matches.
- Web PDF viewer & embedded YouTube player modals.

## Deployment Setup

See [VERCEL_SETUP.md](./VERCEL_SETUP.md) for full GitHub upload and Vercel hosting instructions.
