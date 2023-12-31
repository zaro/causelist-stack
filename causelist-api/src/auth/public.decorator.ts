import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const IS_INTERNAL_ROUTE_KEY = 'isInternalRoute';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
export const InternalRoute = () => SetMetadata(IS_INTERNAL_ROUTE_KEY, true);
