Google sign-in should only allow @epu.edu.iq emails
Other email domains should redirect to /unauthorized
Fix the sign-up flow that's redirecting to 404
# 🎯 Your Goal

Create a Next.js application using modern technologies to build a simple and scalable platform for **EPU Student Announcements**, with **Clerk authentication** and **role-based dashboard access**.

# Technologies Used:

- Next.js 14 as the framework
- TypeScript for type safety
- Tailwind CSS for styling
- Clerk for authentication
- (Optional Later) Prisma or simple local JSON storage for announcements
- Vercel for deployment

# Core Functionality

## 1. Authentication

- Full Clerk integration
- Configure domain restriction: allow only emails ending with `@epu.edu.iq`
- Basic User fields fetched:
  - `id`
  - `email`
  - `imageUrl`
  - `role` (admin or student — stored in Clerk metadata)

## 2. Routing & Pages

- Main Landing Page `/`
  - Welcome Text
  - Login Button (`SignInButton`)
- After Login:
  - Show Profile Picture
  - Check User Role
    - If `role == admin` ➔ Redirect to `/admin`
    - Else ➔ Stay on `/dashboard`
- Admin Panel `/admin`
  - Simple page for now (Just text: “Welcome Admin”)

## 3. Authorization & Redirection

- Middleware or server checks:
  - Redirect **students** away if they try to access `/admin`
- Protect `/admin` page
- Use Clerk's `currentUser()` function in server components

# Pages

## Home Page `/`

- Landing page
- Login button
- After login → show user profile pic and button to go to Dashboard

## Dashboard Page `/dashboard`

- Student home
- For now, just welcome message and maybe "No Announcements Yet"

## Admin Panel `/admin`

- Admin home
- Protected page
- Only accessible by users with `role == admin`

# Important Implementation Notes

## 0. Project Setup

- Components in `/components`
- Pages in `/app`
- Using Next.js 14 **App Router** structure
- Tailwind CSS setup for clean styling

## 1. Clerk Authentication Setup

```ts
import { ClerkProvider } from '@clerk/nextjs'
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      {children}
    </ClerkProvider>
  )
}
```

- Secure environment variables
- Configure Clerk in `_app.tsx` or Root Layout

## 2. Redirect After Login

- Use Clerk hooks (`useUser()`) to get logged-in user
- Based on `role`, redirect using `useRouter().push('/admin')` or `/dashboard`

## 3. Type Safety

- Use TypeScript for all props and API calls
- Define User interface for type safety

## 4. Environment Variables

- Store Clerk API keys in `.env.local`
- Secure environment on Vercel deployment

## 5. Error Handling

- If user has no role assigned → redirect to login or error page
- Show loading while checking authentication state

# Deployment

- Create GitHub repository
- Push project
- Deploy on Vercel
- Set up environment variables on Vercel dashboard

---

# 🧠 Summary

You are building a **basic but professional authentication-based platform** with:
- Clerk-based login
- Role-based redirection
- Protected pages
- Clean modern Next.js 14 structure

---