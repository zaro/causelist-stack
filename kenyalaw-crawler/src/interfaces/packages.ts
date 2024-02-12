export const PACKAGES: Array<{
  id: string;
  period: number;
  unit: 'day' | 'week' | 'month' | 'year';
  price: number;
  title: string;
}> = [
  {
    id: 'week1',
    period: 1,
    unit: 'week',
    price: 100,
    title: '1 Week',
  },
  {
    id: 'month1',
    period: 1,
    unit: 'month',
    price: 350,
    title: '1 Month',
  },
  {
    id: 'month6',
    period: 6,
    unit: 'month',
    price: 1950,
    title: '6 Months',
  },
  {
    id: 'year1',
    period: 1,
    unit: 'year',
    price: 3850,
    title: '1 year',
  },
];
