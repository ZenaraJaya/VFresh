export function homeForRole(role?: string | null, vendorStatus?: string) {
  if (role === 'ADMIN') return '/admin';
  if (role === 'VENDOR') {
    return vendorStatus === 'APPROVED' ? '/vendor' : '/vendor/pending';
  }
  if (role === 'DELIVERY') return '/delivery';
  return '/';
}

export function roleLabel(role?: string | null) {
  if (role === 'ADMIN') return 'admin';
  if (role === 'VENDOR') return 'kitchen';
  if (role === 'DELIVERY') return 'rider';
  if (role === 'CUSTOMER') return 'customer';
  return 'another';
}
