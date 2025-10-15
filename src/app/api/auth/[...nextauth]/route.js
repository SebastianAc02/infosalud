// file: src/app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

/**
 * Usuarios de demo (en memoria)
 * - Ana Médica      -> médico
 * - Carlos Auxiliar -> auxiliar
 * - Admin General   -> administrador
 */
const DEMO_USERS = [
  {
    id: "u_med_demo",
    name: "Ana Médica",
    email: "ana@eps.test",
    password: "ana123",
    role: "medico",
  },
  {
    id: "u_aux_demo",
    name: "Carlos Auxiliar",
    email: "carlos@eps.test",
    password: "carlos123",
    role: "auxiliar",
  },
  {
    id: "u_admin_demo",
    name: "Admin General",
    email: "admin@eps.test",
    password: "admin123",
    role: "administrador", 
  },
];

export const authOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Correo", type: "email", placeholder: "usuario@eps.test" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email || "").toLowerCase().trim();
        const password = String(credentials?.password || "");

        const user = DEMO_USERS.find(
          (u) => u.email.toLowerCase() === email && u.password === password
        );

        if (!user) return null;
        // Devuelve objeto sin password
        const { password: _p, ...safe } = user;
        return safe;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Primera vez (login): mezcla datos del usuario en el token
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      // Expone el rol (y otros) en session.user
      if (session?.user) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.role = token.role; 
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
