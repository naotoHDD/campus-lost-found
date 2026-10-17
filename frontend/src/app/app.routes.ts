import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path:'', loadComponent:()=>import('./features/home/pages/home/home').then(m=>m.Home) },
  { path:'login', loadComponent:()=>import('./features/auth/pages/login/login').then(m=>m.Login) },
  { path:'register', loadComponent:()=>import('./features/auth/pages/register/register').then(m=>m.Register) },
  { path:'items', loadComponent:()=>import('./features/items/pages/item-list/item-list').then(m=>m.ItemList) },
  { path:'items/:id', loadComponent:()=>import('./features/items/pages/item-detail/item-detail').then(m=>m.ItemDetail) },
  { path:'publish', canActivate:[authGuard], loadComponent:()=>import('./features/items/pages/item-create/item-create').then(m=>m.ItemCreate) },
  { path:'my-items', canActivate:[authGuard], loadComponent:()=>import('./features/items/pages/my-items/my-items').then(m=>m.MyItems) },
  { path:'claims/new/:itemId', canActivate:[authGuard], loadComponent:()=>import('./features/claims/pages/create-claim/create-claim').then(m=>m.CreateClaim) },
  { path:'my-claims', canActivate:[authGuard], loadComponent:()=>import('./features/claims/pages/my-claims/my-claims').then(m=>m.MyClaims) },
  { path:'recovery/:claimId', canActivate:[authGuard], loadComponent:()=>import('./features/recovery/pages/recovery/recovery').then(m=>m.Recovery) },
  { path:'notifications', canActivate:[authGuard], loadComponent:()=>import('./features/notifications/pages/notifications/notifications').then(m=>m.Notifications) },
  { path:'profile', canActivate:[authGuard], loadComponent:()=>import('./features/profile/pages/profile/profile').then(m=>m.Profile) },
  {
    path:'admin', canActivate:[adminGuard],
    loadComponent:()=>import('./features/admin/layout/admin-layout').then(m=>m.AdminLayout),
    children:[
      { path:'', loadComponent:()=>import('./features/admin/pages/admin-dashboard/admin-dashboard').then(m=>m.AdminDashboard) },
      { path:'items', loadComponent:()=>import('./features/admin/pages/admin-items/admin-items').then(m=>m.AdminItems) },
      { path:'claims', loadComponent:()=>import('./features/admin/pages/admin-claims/admin-claims').then(m=>m.AdminClaims) },
      { path:'users', loadComponent:()=>import('./features/admin/pages/admin-users/admin-users').then(m=>m.AdminUsers) },
      { path:'categories', loadComponent:()=>import('./features/admin/pages/admin-categories/admin-categories').then(m=>m.AdminCategories) },
      { path:'locations', loadComponent:()=>import('./features/admin/pages/admin-locations/admin-locations').then(m=>m.AdminLocations) }
    ]
  },
  { path:'**', redirectTo:'' }
];
