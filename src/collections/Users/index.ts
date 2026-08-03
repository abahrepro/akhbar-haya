import type { CollectionConfig } from 'payload'

import { canAccessAdmin, isAdmin, isAdminField, ROLE_LABELS } from '../../access/roles'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: 'مستخدم',
    plural: 'المستخدمون',
  },
  access: {
    // الدخول إلى اللوحة متاح لكل الطاقم
    admin: canAccessAdmin,
    // إدارة المستخدمين للمديرين فقط
    create: isAdmin,
    delete: isAdmin,
    update: isAdmin,
    // كل مستخدم يرى نفسه؛ المدير يرى الجميع
    read: ({ req: { user } }) => {
      if (!user) return false
      if ((user as { role?: string }).role === 'admin') return true
      return { id: { equals: user.id } }
    },
  },
  admin: {
    group: 'إعدادات',
    defaultColumns: ['name', 'email', 'role'],
    useAsTitle: 'name',
    // يظهر في الشريط الجانبي للمديرين فقط
    hidden: ({ user }) => (user as { role?: string })?.role !== 'admin',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      label: 'الاسم',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      label: 'الدور',
      type: 'select',
      required: true,
      defaultValue: 'contributor',
      options: (Object.keys(ROLE_LABELS) as (keyof typeof ROLE_LABELS)[]).map((value) => ({
        label: ROLE_LABELS[value],
        value,
      })),
      // لا يغيّر الدورَ إلا مدير — يمنع رفع المستخدم صلاحيته بنفسه
      access: {
        create: isAdminField,
        update: isAdminField,
      },
      admin: {
        description:
          'مدير: كل شيء · رئيس تحرير: ينشر ويحذف ويدير التصنيفات · محرّر: ينشر بلا حذف · مساهم: مسودات فقط.',
      },
    },
  ],
  timestamps: true,
}
