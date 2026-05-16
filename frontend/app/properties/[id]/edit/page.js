'use client';
import { useParams } from 'next/navigation';
import PropertyForm from '../../../../components/property/PropertyForm';

export default function EditPropertyPage() {
  const { id } = useParams();
  return <PropertyForm propertyId={id} />;
}
