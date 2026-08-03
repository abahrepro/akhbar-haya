import type { Access, FieldAccess } from 'payload'

import type { User } from '@/payload-types'

export type Role = 'admin' | 'editorInChief' | 'editor' | 'contributor'

/** ترتيب الأدوار من الأعلى صلاحية إلى الأدنى */
export const ROLE_ORDER: Role[] = ['admin', 'editorInChief', 'editor', 'contributor']

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'مدير',
  editorInChief: 'رئيس تحرير',
  editor: 'محرّر',
  contributor: 'مساهم',
}

const roleOf = (user: unknown): Role | null => {
  const r = (user as User | null | undefined)?.role
  return (r as Role) ?? null
}

/** هل يملك المستخدم أحد الأدوار المحدّدة؟ */
export const hasRole =
  (...roles: Role[]): Access =>
  ({ req: { user } }) => {
    const r = roleOf(user)
    return r !== null && roles.includes(r)
  }

/** نسخة صالحة لصلاحيات الحقول */
export const fieldHasRole =
  (...roles: Role[]): FieldAccess =>
  ({ req: { user } }) => {
    const r = roleOf(user)
    return r !== null && roles.includes(r)
  }

/* ===== اختصارات جاهزة ===== */

/** المديرون فقط */
export const isAdmin: Access = hasRole('admin')
export const isAdminField: FieldAccess = fieldHasRole('admin')

/** من يملك صلاحية النشر والحذف */
export const canPublish: Access = hasRole('admin', 'editorInChief', 'editor')

/** من يملك حق الحذف */
export const canDelete: Access = hasRole('admin', 'editorInChief')

/** أي مستخدم له دور معروف (يشمل المساهم) */
export const isStaff: Access = hasRole('admin', 'editorInChief', 'editor', 'contributor')

/** من يدير التصنيفات (الأقسام والوسوم) */
export const canManageTaxonomy: Access = hasRole('admin', 'editorInChief')

/**
 * قراءة الأخبار:
 *  - الزائر: المنشور فقط
 *  - المساهم: المنشور + مسوّداته هو
 *  - باقي الطاقم: كل شيء
 */
export const readPosts: Access = ({ req: { user } }) => {
  const role = roleOf(user)

  if (role === 'admin' || role === 'editorInChief' || role === 'editor') return true

  if (role === 'contributor' && user) {
    return {
      or: [{ _status: { equals: 'published' } }, { createdBy: { equals: user.id } }],
    }
  }

  return { _status: { equals: 'published' } }
}

/**
 * تعديل الأخبار:
 *  - المساهم: مسوّداته غير المنشورة فقط
 *  - باقي الطاقم: كل شيء
 */
export const updatePosts: Access = ({ req: { user } }) => {
  const role = roleOf(user)

  if (role === 'admin' || role === 'editorInChief' || role === 'editor') return true

  if (role === 'contributor' && user) {
    return {
      and: [{ createdBy: { equals: user.id } }, { _status: { not_equals: 'published' } }],
    }
  }

  return false
}

/** الدخول إلى لوحة التحكّم — أي فرد من الطاقم */
export const canAccessAdmin: Access = isStaff
