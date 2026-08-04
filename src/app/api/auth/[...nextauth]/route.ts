import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('Vui lòng nhập tài khoản và mật khẩu');
        }

        await dbConnect();

        // Auto-seed admin & default users if admin missing
        const adminUser = await User.findOne({ role: 'admin' });
        if (!adminUser) {
          const hashedPassword = await bcrypt.hash('123456', 12);
          await User.create([
            {
              username: 'admin',
              password: hashedPassword,
              fullName: 'Quản trị viên (Admin)',
              role: 'admin',
              allowedCategories: ['cell', 'thinprep', 'hpv40', 'hpv20'],
            },
            {
              username: 'nhanvien',
              password: hashedPassword,
              fullName: 'Nhân viên GenHD',
              role: 'staff',
              allowedCategories: ['cell', 'thinprep', 'hpv40', 'hpv20'],
            },
            {
              username: 'bcsihung',
              password: hashedPassword,
              fullName: 'BS CK1 PHẠM THẾ HÙNG',
              role: 'doctor',
              allowedCategories: ['cell', 'thinprep', 'hpv40', 'hpv20'],
            },
            {
              username: 'bacsi',
              password: hashedPassword,
              fullName: 'TS. BS. Nguyễn Khánh Dương',
              role: 'doctor',
              allowedCategories: ['cell', 'thinprep', 'hpv40'],
            },
            {
              username: 'bcsidung',
              password: hashedPassword,
              fullName: 'BS. Đoàn Xuân Dũng',
              role: 'doctor',
              allowedCategories: ['hpv20'],
            },
          ]);
        }

        const user = await User.findOne({ username: credentials.username.toLowerCase() });

        if (!user) {
          throw new Error('Tài khoản không tồn tại');
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error('Mật khẩu không đúng');
        }

        return {
          id: user._id.toString(),
          name: user.fullName,
          email: user.username,
          role: user.role,
          allowedCategories: user.allowedCategories || ['cell', 'thinprep', 'hpv40', 'hpv20'],
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
        token.allowedCategories = (user as any).allowedCategories || ['cell', 'thinprep', 'hpv40', 'hpv20'];
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role as string;
        (session.user as any).id = token.id as string;
        (session.user as any).allowedCategories = (token.allowedCategories as string[]) || ['cell', 'thinprep', 'hpv40', 'hpv20'];
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
