# Admin User Setup

## Admin Credentials
- **Email**: proxeadmin@proxe.com (or use your preferred email)
- **Password**: proxepass

## Method 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Authentication > Users**
3. Click **"Add User"** > **"Create new user"**
4. Enter:
   - **Email**: `proxeadmin@proxe.com`
   - **Password**: `proxepass`
   - Check **"Auto Confirm User"**
5. Click **"Create User"**
6. Copy the **User ID** (UUID)
7. Go to **SQL Editor** and run:

```sql
UPDATE dashboard_users 
SET role = 'admin' 
WHERE id = 'PASTE_USER_ID_HERE';
```

## Method 2: Using SQL Directly

If you want to use a specific email:

```sql
UPDATE dashboard_users 
SET role = 'admin' 
WHERE email = 'proxeadmin@proxe.com';
```

## Method 3: Using Node Script

1. Set environment variables:
```bash
export SUPABASE_URL=your_supabase_url
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

2. Run the script:
```bash
node scripts/create-admin-user.js
```

## Verify Admin Access

After setup, login at `/auth/login` with:
- Email: `proxeadmin@proxe.com`
- Password: `proxepass`

You should have admin access to invite other users and manage the dashboard.

