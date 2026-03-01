import { useEffect, useState } from 'react';
import { 
  Box, Typography, Paper, IconButton, Tooltip, Dialog, 
  DialogTitle, DialogContent, DialogActions, Button, Snackbar, Alert,
  FormControl, InputLabel, Select, MenuItem, Avatar, Chip,} from '@mui/material';
import { DataGrid, GridToolbarContainer } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { 
  Block, CheckCircleOutline, ManageAccounts, 
  AdminPanelSettings, MenuBook, PersonOutline, People
} from '@mui/icons-material';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

// SENIOR DEV FIX: Idinagdag natin ang avatar_url sa interface
interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null; 
  role: string;
  status: string;
  created_at: string;
}

export default function UserManagement() {
  const { profile: currentUser } = useAuth(); 
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [statusDialog, setStatusDialog] = useState<{ open: boolean, id: string, name: string, currentStatus: string } | null>(null);
  const [roleDialog, setRoleDialog] = useState<{ open: boolean, id: string, name: string, currentRole: string } | null>(null);
  const [newRole, setNewRole] = useState('');
  const [toast, setToast] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      showToast('Failed to load users', 'error');
    } else {
      if (data) {
        const formattedData = (data as any[]).map(user => ({
          ...user,
          status: user.status || 'active'
        }));
        setUsers(formattedData as Profile[]);
      } else {
        setUsers([]);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showToast = (message: string, severity: 'success' | 'error') => {
    setToast({ open: true, message, severity });
  };

  const handleUpdateStatus = async () => {
    if (!statusDialog) return;
    const newStatus = statusDialog.currentStatus === 'active' ? 'banned' : 'active';
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', statusDialog.id);

    if (error) {
      showToast(error.message, 'error');
    } else {
      setUsers(prev => prev.map(u => u.id === statusDialog.id ? { ...u, status: newStatus } : u));
      showToast(`User ${newStatus === 'banned' ? 'banned' : 'unbanned'} successfully!`, 'success');
    }
    setStatusDialog(null);
  };

  const handleUpdateRole = async () => {
    if (!roleDialog || !newRole) return;
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', roleDialog.id);

    if (error) {
      showToast(error.message, 'error');
    } else {
      setUsers(prev => prev.map(u => u.id === roleDialog.id ? { ...u, role: newRole } : u));
      showToast(`User role updated to ${newRole}!`, 'success');
    }
    setRoleDialog(null);
  };

  const CustomToolbar = () => (
    <GridToolbarContainer sx={{ p: 2, borderBottom: '1px solid #e2e8f0' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#0f172a' }}>
        Registered Accounts
      </Typography>
    </GridToolbarContainer>
  );

  const columns: GridColDef[] = [
    { 
      field: 'full_name', 
      headerName: 'User Details', 
      flex: 1, 
      minWidth: 250,
      renderCell: (params) => {
        // SENIOR DEV FIX: Custom logic para sa picture o default ui-avatar
        const name = params.row.full_name || 'User';
        const avatarSrc = params.row.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f1f5f9&color=64748b&bold=true`;

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, height: '100%' }}>
            <Avatar 
              src={avatarSrc}
              sx={{ width: 38, height: 38, border: '1px solid #e2e8f0' }} 
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a', lineHeight: 1.2 }}>
                {name}
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                ID: {params.row.id.substring(0, 8)}...
              </Typography>
            </Box>
          </Box>
        );
      }
    },
    { 
      field: 'role', 
      headerName: 'Role', 
      width: 140,
      renderCell: (params) => {
        const role = params.value as string;
        let icon = <PersonOutline fontSize="small" />;
        let bgColor = '#f1f5f9'; let textColor = '#64748b';

        if (role === 'admin') {
          icon = <AdminPanelSettings fontSize="small" />;
          bgColor = '#e0e7ff'; textColor = '#4f46e5'; 
        } else if (role === 'author') {
          icon = <MenuBook fontSize="small" />;
          bgColor = '#fae8ff'; textColor = '#c026d3'; 
        }

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Chip icon={icon} label={role} size="small" sx={{ backgroundColor: bgColor, color: textColor, fontWeight: 'bold', textTransform: 'capitalize', borderRadius: 1.5, '& .MuiChip-icon': { color: textColor } }} />
          </Box>
        );
      }
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 120,
      renderCell: (params) => {
        const status = params.value as string;
        const isActive = status === 'active';
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Chip label={status} size="small" sx={{ backgroundColor: isActive ? '#dcfce7' : '#fee2e2', color: isActive ? '#16a34a' : '#dc2626', fontWeight: 'bold', textTransform: 'uppercase', borderRadius: 1.5, fontSize: '0.7rem' }} />
          </Box>
        );
      }
    },
    { 
      field: 'created_at', 
      headerName: 'Joined Date', 
      width: 160,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            {new Date(params.value as string).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </Typography>
        </Box>
      )
    },
    {
      field: 'actions', headerName: 'Actions', width: 150, sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        const isSelf = params.row.id === currentUser?.id;
        const isActive = params.row.status === 'active';

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: '100%' }}>
            <Tooltip title={isSelf ? "Cannot change own role" : "Change Role"} arrow>
              <span>
                <IconButton size="small" disabled={isSelf} onClick={() => { setNewRole(params.row.role); setRoleDialog({ open: true, id: params.row.id, name: params.row.full_name || 'User', currentRole: params.row.role }); }} sx={{ backgroundColor: '#eff6ff', color: '#2563eb', '&:hover': { backgroundColor: '#dbeafe' }, '&.Mui-disabled': { opacity: 0.5 } }}>
                  <ManageAccounts fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={isSelf ? "Cannot ban yourself" : (isActive ? "Ban User" : "Unban User")} arrow>
              <span>
                <IconButton size="small" disabled={isSelf} onClick={() => setStatusDialog({ open: true, id: params.row.id, name: params.row.full_name || 'User', currentStatus: params.row.status })} sx={{ backgroundColor: isActive ? '#fef2f2' : '#ecfdf5', color: isActive ? '#dc2626' : '#16a34a', '&:hover': { backgroundColor: isActive ? '#fee2e2' : '#d1fae5' }, '&.Mui-disabled': { opacity: 0.5 } }}>
                  {isActive ? <Block fontSize="small" /> : <CheckCircleOutline fontSize="small" />}
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  return (
    <Box sx={{ maxWidth: '1200px', pb: 8 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em', mb: 0.5 }}>User Management</Typography>
        <Typography variant="body1" sx={{ color: '#64748b' }}>Monitor and manage roles and account statuses of all GenrA users.</Typography>
      </Box>

      <Paper elevation={0} sx={{ height: 600, width: '100%', borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
        <DataGrid
          rows={users} columns={columns} loading={loading} disableRowSelectionOnClick rowHeight={70} 
          slots={{ toolbar: CustomToolbar, noRowsOverlay: () => (<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}><People sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} /><Typography variant="h6" sx={{ fontWeight: 'bold', color: '#64748b' }}>No users found</Typography></Box>) }}
          sx={{ border: 'none', '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f8fafc', color: '#475569', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }, '& .MuiDataGrid-cell': { borderColor: '#f1f5f9' } }}
        />
      </Paper>

      <Dialog open={!!roleDialog} onClose={() => setRoleDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: '#0f172a', pb: 1 }}>Change User Role</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>Select a new role for <strong>{roleDialog?.name}</strong>.</Typography>
          <FormControl fullWidth>
            <InputLabel id="role-select-label">Account Role</InputLabel>
            <Select labelId="role-select-label" value={newRole} label="Account Role" onChange={(e) => setNewRole(e.target.value)}>
              <MenuItem value="reader">Reader</MenuItem>
              <MenuItem value="author">Author</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setRoleDialog(null)} sx={{ color: '#64748b', fontWeight: 'bold' }}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateRole} disabled={newRole === roleDialog?.currentRole} sx={{ backgroundColor: '#2563eb', boxShadow: 'none', fontWeight: 'bold' }}>Update Role</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!statusDialog} onClose={() => setStatusDialog(null)}>
        <DialogTitle sx={{ fontWeight: 'bold', color: statusDialog?.currentStatus === 'active' ? '#dc2626' : '#16a34a' }}>{statusDialog?.currentStatus === 'active' ? 'Ban User?' : 'Unban User?'}</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to {statusDialog?.currentStatus === 'active' ? 'ban' : 'unban'} <strong>"{statusDialog?.name}"</strong>? {statusDialog?.currentStatus === 'active' ? " They will no longer be able to access the app." : " Their access to the app will be restored."}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog(null)} sx={{ color: '#64748b', fontWeight: 'bold' }}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateStatus} sx={{ backgroundColor: statusDialog?.currentStatus === 'active' ? '#dc2626' : '#16a34a', boxShadow: 'none', fontWeight: 'bold', '&:hover': { backgroundColor: statusDialog?.currentStatus === 'active' ? '#b91c1c' : '#15803d' } }}>Yes, {statusDialog?.currentStatus === 'active' ? 'Ban' : 'Unban'}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast({ ...toast, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setToast({ ...toast, open: false })} severity={toast.severity} sx={{ width: '100%', boxShadow: 3 }}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}