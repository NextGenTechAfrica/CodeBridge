import { redirect } from 'next/navigation';

export default function ProspectsRedirectPage() {
  redirect('/dashboard/representative/clients');
}
