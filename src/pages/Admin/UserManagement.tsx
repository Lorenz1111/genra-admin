import { useEffect, useState } from 'react';
import { 
  Box, Typography, Paper, IconButton, Tooltip, Dialog, 
  DialogTitle, DialogContent, DialogActions, Button, Snackbar, Alert,
  FormControl, InputLabel, Select, MenuItem, Avatar, Chip, Skeleton, Divider, TextField
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { DataGrid, GridToolbarContainer } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { 
  Block, CheckCircleOutline, ManageAccounts, 
  AdminPanelSettings, MenuBook, PersonOutline, People, Visibility, Person
} from '@mui/icons-material';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null; 
  role: string;
  status: string;
  created_at: string;
  // Note: Standard setup stores email in auth.users. 
  // We'll leave an email placeholder below just in case you add it to public profiles later.
  email?: string; 
}

export default function UserManagement() {
  const { profile: currentUser } = useAuth(); 
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [statusDialog, setStatusDialog] = useState<{ open: boolean, id: string, name: string, currentStatus: string } | null>(null);
  const [roleDialog, setRoleDialog] = useState<{ open: boolean, id: string, name: string, currentRole: string } | null>(null);
  // SD Feature: State for "View User Information"
  const [viewDialog, setViewDialog] = useState<Profile | null>(null);
  const [newRole, setNewRole] = useState('');
  const [statusConfirmationText, setStatusConfirmationText] = useState('');
  const [toast, setToast] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedData = (data as any[]).map(user => ({
          ...user,
          status: user.status || 'active'
        }));
        setUsers(formattedData as Profile[]);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
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
    try {
      const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', statusDialog.id);
      if (error) throw error;
      
      setUsers(prev => prev.map(u => u.id === statusDialog.id ? { ...u, status: newStatus } : u));
      showToast(`User ${newStatus === 'banned' ? 'banned' : 'unbanned'} successfully!`, 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      handleCloseStatusDialog();
    }
  };

  const handleCloseStatusDialog = () => {
    setStatusDialog(null);
    setStatusConfirmationText('');
  };

  const handleUpdateRole = async () => {
    if (!roleDialog || !newRole) return;
    try {
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', roleDialog.id);
      if (error) throw error;
      
      setUsers(prev => prev.map(u => u.id === roleDialog.id ? { ...u, role: newRole } : u));
      showToast(`User role updated to ${newRole}!`, 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setRoleDialog(null);
    }
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
        const name = params.row.full_name || 'User';
        const avatarSrc = params.row.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f1f5f9&color=64748b&bold=true`;

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, height: '100%' }}>
            <Avatar src={avatarSrc} sx={{ width: 38, height: 38, border: '1px solid #e2e8f0' }} />
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
      field: 'actions', headerName: 'Actions', width: 160, sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        const isSelf = params.row.id === currentUser?.id;
        const isActive = params.row.status === 'active';

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: '100%' }}>
            {/* SD FEATURE: View User Info Button */}
            <Tooltip title="View User Details" arrow>
              <IconButton size="small" onClick={() => setViewDialog(params.row as Profile)} sx={{ backgroundColor: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', '&:hover': { backgroundColor: '#f1f5f9' } }}>
                <Visibility fontSize="small" />
              </IconButton>
            </Tooltip>
            
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
    <Box sx={{ maxWidth: '1200px', mx: 'auto', pb: 8 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em', mb: 0.5 }}>User Management</Typography>
        <Typography variant="body1" sx={{ color: '#64748b' }}>Monitor and manage roles and account statuses of all GenrA users.</Typography>
      </Box>

      <Paper elevation={0} sx={{ height: 650, width: '100%', borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
        <DataGrid
          rows={users} 
          columns={columns} 
          loading={loading} 
          disableRowSelectionOnClick 
          rowHeight={70} 
          // SD FEATURE: Limiting rows to 10
          initialState={{
            pagination: { paginationModel: { pageSize: 10, page: 0 } },
          }}
          pageSizeOptions={[10, 25, 50]}
          slots={{ 
            toolbar: CustomToolbar, 
            // SD FEATURE: Consistent Skeleton Loading Setup
            loadingOverlay: () => (
              <Box sx={{ p: 2 }}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                  <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, borderBottom: '1px solid #f1f5f9', pb: 1.5 }}>
                    <Skeleton variant="circular" width={40} height={40} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="40%" height={24} />
                      <Skeleton variant="text" width="20%" height={16} />
                    </Box>
                    <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1.5 }} />
                    <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1.5 }} />
                    <Skeleton variant="text" width={100} height={24} />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Skeleton variant="circular" width={30} height={30} />
                      <Skeleton variant="circular" width={30} height={30} />
                      <Skeleton variant="circular" width={30} height={30} />
                    </Box>
                  </Box>
                ))}
              </Box>
            ),
            noRowsOverlay: () => (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                <People sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#64748b' }}>No users found</Typography>
              </Box>
            ) 
          }}
          sx={{ 
            border: 'none', 
            '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f8fafc', color: '#475569', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }, 
            '& .MuiDataGrid-cell': { borderColor: '#f1f5f9' },
            '& .MuiTablePagination-root': { color: '#475569', borderTop: '1px solid #e2e8f0' }
          }}
        />
      </Paper>

      {/* ======================================================= */}
      {/* MODALS                                                    */}
      {/* ======================================================= */}

      {/* 1. SD FEATURE: View User Information Modal */}
      <Dialog open={!!viewDialog} onClose={() => setViewDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: '#0f172a', borderBottom: '1px solid #e2e8f0', pb: 2 }}>
          User Profile
        </DialogTitle>
        <DialogContent sx={{ mt: 3, pb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
            <Avatar 
              src={viewDialog?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(viewDialog?.full_name || 'User')}&background=f1f5f9&color=64748b&bold=true`}
              sx={{ width: 80, height: 80, border: '2px solid #e2e8f0' }} 
            />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                {viewDialog?.full_name || 'Unknown User'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
                System ID: {viewDialog?.id}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Assigned Role</Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip 
                  label={viewDialog?.role || 'reader'} 
                  size="small" 
                  icon={viewDialog?.role === 'admin' ? <AdminPanelSettings /> : viewDialog?.role === 'author' ? <MenuBook /> : <Person />}
                  sx={{ 
                    backgroundColor: viewDialog?.role === 'admin' ? '#e0e7ff' : viewDialog?.role === 'author' ? '#fae8ff' : '#f1f5f9', 
                    color: viewDialog?.role === 'admin' ? '#4f46e5' : viewDialog?.role === 'author' ? '#c026d3' : '#64748b', 
                    fontWeight: 'bold', textTransform: 'capitalize', borderRadius: 1.5 
                  }} 
                />
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Account Status</Typography>
              <Box sx={{ mt: 0.5 }}>
                <Chip 
                  label={viewDialog?.status || 'active'} 
                  size="small" 
                  sx={{ 
                    backgroundColor: viewDialog?.status === 'active' ? '#dcfce7' : '#fee2e2', 
                    color: viewDialog?.status === 'active' ? '#16a34a' : '#dc2626', 
                    fontWeight: 'bold', textTransform: 'uppercase', borderRadius: 1.5 
                  }} 
                />
              </Box>
            </Grid>
            <Grid item xs={12} sx={{ mt: 1 }}>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Date Registered</Typography>
              <Typography variant="body1" sx={{ color: '#0f172a', fontWeight: 500 }}>
                {viewDialog?.created_at ? new Date(viewDialog.created_at).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unknown'}
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={() => setViewDialog(null)} sx={{ color: '#64748b', fontWeight: 'bold' }}>Close Profile</Button>
        </DialogActions>
      </Dialog>

      {/* 2. Change Role Modal */}
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

      {/* 3. Change Status (Ban/Unban) Modal */}
      <Dialog open={!!statusDialog} onClose={handleCloseStatusDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: statusDialog?.currentStatus === 'active' ? '#dc2626' : '#16a34a' }}>{statusDialog?.currentStatus === 'active' ? 'Ban User?' : 'Unban User?'}</DialogTitle>
        <DialogContent>
          {statusDialog?.currentStatus === 'active' && (
            <Alert severity="warning" sx={{ mb: 2, fontWeight: 'bold' }}>
              Warning: Banning this user will immediately block their access to the app until an admin restores it.
            </Alert>
          )}
          <Typography sx={{ mb: statusDialog?.currentStatus === 'active' ? 1.5 : 0 }}>
            Are you sure you want to {statusDialog?.currentStatus === 'active' ? 'ban' : 'unban'} <strong>"{statusDialog?.name}"</strong>? {statusDialog?.currentStatus === 'active' ? " They will no longer be able to access the app." : " Their access to the app will be restored."}
          </Typography>
          {statusDialog?.currentStatus === 'active' && (
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder={statusDialog?.name}
              value={statusConfirmationText}
              onChange={(e) => setStatusConfirmationText(e.target.value)}
              helperText="Type the user's name to confirm the ban."
              sx={{ mt: 1 }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseStatusDialog} sx={{ color: '#64748b', fontWeight: 'bold' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleUpdateStatus}
            disabled={statusDialog?.currentStatus === 'active' && statusConfirmationText !== statusDialog?.name}
            sx={{ backgroundColor: statusDialog?.currentStatus === 'active' ? '#dc2626' : '#16a34a', boxShadow: 'none', fontWeight: 'bold', '&:hover': { backgroundColor: statusDialog?.currentStatus === 'active' ? '#b91c1c' : '#15803d' }, '&.Mui-disabled': { backgroundColor: statusDialog?.currentStatus === 'active' ? '#fca5a5' : '#86efac', color: '#fff' } }}
          >
            Yes, {statusDialog?.currentStatus === 'active' ? 'Ban' : 'Unban'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast({ ...toast, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setToast({ ...toast, open: false })} severity={toast.severity} sx={{ width: '100%', boxShadow: 3 }}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}
