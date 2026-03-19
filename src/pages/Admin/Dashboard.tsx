import { useEffect, useState } from 'react';
import { 
  Box, Typography, Paper, Avatar, Button, Chip, Skeleton, Tooltip 
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { 
  People, LibraryBooks, RateReview, Category, 
  Settings, Article 
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { session, profile } = useAuth(); 
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalBooks, setTotalBooks] = useState(0);
  const [pendingReviews, setPendingReviews] = useState(0);
  const [totalGenres, setTotalGenres] = useState(0);
  const [recentBooks, setRecentBooks] = useState<any[]>([]);

  useEffect(() => {
    const fetchAdminAnalytics = async () => {
      if (!session) return;

      try {
        const [
          { count: usersCount, error: usersError },
          { count: booksCount, error: booksError },
          { count: pendingCount, error: pendingError },
          { count: genresCount, error: genresError },
          { data: recent, error: recentError }
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('books').select('*', { count: 'exact', head: true }),
          supabase.from('books').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
          supabase.from('genres').select('*', { count: 'exact', head: true }),
          supabase.from('books')
            .select('id, title, cover_url, status, created_at, profiles(full_name), book_genres(genres(name))')
            .order('created_at', { ascending: false })
            .limit(50) 
        ]);

        if (usersError) throw usersError;
        if (booksError) throw booksError;
        if (pendingError) throw pendingError;
        if (genresError) throw genresError;
        if (recentError) throw recentError;

        setTotalUsers(usersCount || 0);
        setTotalBooks(booksCount || 0);
        setPendingReviews(pendingCount || 0);
        setTotalGenres(genresCount || 0);
        setRecentBooks(recent || []);

      } catch (error) {
        console.error('Error fetching admin analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminAnalytics();
  }, [session]);

  const columns: GridColDef[] = [
    { 
      field: 'cover_url', 
      headerName: 'Cover', 
      width: 80,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <img 
            src={params.value as string || 'https://via.placeholder.com/50'} 
            alt="cover" 
            style={{ width: 40, height: 56, objectFit: 'cover', borderRadius: 4, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
          />
        </Box>
      )
    },
    { 
      field: 'title', 
      headerName: 'Recently Added Books', 
      flex: 1, 
      minWidth: 220,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', gap: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.2, whiteSpace: 'normal', wordWrap: 'break-word' }}>
            {params.value}
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: '500' }}>
            By: {params.row.profiles?.full_name || 'Unknown Author'}
          </Typography>
        </Box>
      )
    },
    { 
      field: 'genre', 
      headerName: 'Genres', 
      width: 180,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        const genres = (params.row.book_genres?.map((bg: any) => bg.genres?.name).filter(Boolean) as string[]) || [];
        const displayGenres = genres.slice(0, 2);
        const extraGenres = genres.slice(2);

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5, height: '100%' }}>
            {displayGenres.length > 0 ? (
              <>
                {displayGenres.map((genre: string, index: number) => (
                  <Chip key={index} label={genre} size="small" sx={{ backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 600, fontSize: '0.65rem', borderRadius: 1.5 }} />
                ))}
                {extraGenres.length > 0 && (
                  <Tooltip title={extraGenres.join(', ')} arrow placement="top">
                    <Chip label={`+${extraGenres.length}`} size="small" sx={{ backgroundColor: '#e2e8f0', color: '#475569', fontWeight: 'bold', fontSize: '0.65rem', cursor: 'pointer', borderRadius: 1.5 }} />
                  </Tooltip>
                )}
              </>
            ) : (
              <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>None</Typography>
            )}
          </Box>
        );
      }
    },
    {
      field: 'created_at',
      headerName: 'Date Uploaded',
      width: 130,
      renderCell: (params) => {
        const date = params.value ? new Date(params.value as string).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric'
        }) : '-';
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
              {date}
            </Typography>
          </Box>
        );
      }
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 140,
      renderCell: (params: GridRenderCellParams) => {
        const status = (params.value as string | null) || 'unknown';
        
        let bgColor = '#f1f5f9';
        let textColor = '#64748b';

        if (status === 'approved' || status === 'published') {
          bgColor = '#dcfce7'; textColor = '#15803d'; 
        } else if (status === 'pending_review' || status === 'pending') {
          bgColor = '#ffedd5'; textColor = '#ea580c'; 
        } else if (status === 'rejected' || status === 'archived') {
          bgColor = '#fee2e2'; textColor = '#b91c1c'; 
        }

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Chip 
              label={String(status).replace('_', ' ')}
              size="small"
              sx={{ 
                backgroundColor: bgColor, 
                color: textColor, 
                fontWeight: 'bold', 
                textTransform: 'capitalize', 
                borderRadius: 1.5, 
                fontSize: '0.7rem' 
              }} 
            />
          </Box>
        );
      }
    },
    // SD Feature: New Date Approved Column
    {
      field: 'date_approved',
      headerName: 'Date Approved',
      width: 140,
      renderCell: (params) => {
        const status = params.row.status;
        
        // Ipapakita lang natin ang date kung approved na siya
        if (status === 'approved' || status === 'published') {
          // Walang dedicated approval timestamp sa current books schema,
          // kaya created_at muna ang pinakamalapit na safe fallback.
          const dateVal = params.row.created_at;
          const date = dateVal ? new Date(dateVal as string).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
          }) : '-';
          
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              <Typography variant="body2" sx={{ color: '#15803d', fontWeight: 600 }}>
                {date}
              </Typography>
            </Box>
          );
        }

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
              -
            </Typography>
          </Box>
        );
      }
    }
  ];

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', pb: 8 }}>
      
      {/* --- WELCOME HEADER & QUICK ACTIONS --- */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, mb: 5, gap: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Avatar sx={{ width: 64, height: 64, bgcolor: '#f5f3ff', color: '#8b5cf6', fontSize: '1.75rem', fontWeight: 'bold' }}>
            {profile?.full_name?.charAt(0) || 'A'}
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em', mb: 0.5 }}>
              System Overview, {profile?.full_name?.split(' ')[0] || 'Admin'}
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b' }}>
              Here is the current status and health of the GenrA platform.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<RateReview />} 
            onClick={() => navigate('/admin/reviews')}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold', borderColor: '#cbd5e1', color: '#475569' }}
          >
            Review Queue
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Settings />} 
            onClick={() => navigate('/admin/users')}
            sx={{ borderRadius: 2, backgroundColor: '#0f172a', textTransform: 'none', fontWeight: 'bold', boxShadow: 'none', '&:hover': { backgroundColor: '#334155' } }}
          >
            Manage Users
          </Button>
        </Box>
      </Box>

      {/* --- ADMIN STATS CARDS --- */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        <Grid item xs={12} sm={6} md={3}>
           <StatCard title="Total Users" value={loading ? '-' : totalUsers.toLocaleString()} icon={<People fontSize="medium" />} color="#2563eb" bgColor="#eff6ff" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
           <StatCard title="Total Books" value={loading ? '-' : totalBooks.toLocaleString()} icon={<LibraryBooks fontSize="medium" />} color="#10b981" bgColor="#ecfdf5" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
           <StatCard title="Pending Reviews" value={loading ? '-' : pendingReviews.toString()} icon={<RateReview fontSize="medium" />} color="#ea580c" bgColor="#ffedd5" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
           <StatCard title="Active Genres" value={loading ? '-' : totalGenres.toString()} icon={<Category fontSize="medium" />} color="#8b5cf6" bgColor="#f5f3ff" />
        </Grid>
      </Grid>

      {/* --- RECENT ACTIVITY TABLE --- */}
      <Typography variant="h6" sx={{ fontWeight: '800', color: '#0f172a', mb: 2, letterSpacing: '-0.01em' }}>
        Recently Uploaded Books
      </Typography>
      
      <Paper 
        elevation={0} 
        sx={{ 
          height: 480, width: '100%', borderRadius: 3, 
          border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden'
        }}
      >
        <DataGrid
          rows={recentBooks}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          rowHeight={65}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10, page: 0 },
            },
          }}
          pageSizeOptions={[5, 10, 25]}
          slots={{
            // SD Fix: Pinalitan ang loading skeleton para magmukhang actual data rows (Hugis Chip!)
            loadingOverlay: () => (
              <Box sx={{ p: 2 }}>
                {[1, 2, 3, 4, 5].map((item) => (
                  <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, borderBottom: '1px solid #f1f5f9', pb: 1.5 }}>
                    {/* Cover Skeleton */}
                    <Skeleton variant="rectangular" width={40} height={56} sx={{ borderRadius: 1 }} />
                    {/* Text Skeletons */}
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="50%" height={24} />
                      <Skeleton variant="text" width="30%" height={16} />
                    </Box>
                    {/* Chip Skeleton */}
                    <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1.5 }} />
                    {/* Date Skeleton */}
                    <Skeleton variant="text" width={80} height={24} />
                  </Box>
                ))}
              </Box>
            ),
            noRowsOverlay: () => (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                <Article sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#64748b' }}>No recent activity</Typography>
                <Typography variant="body2">The database is currently empty.</Typography>
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
    </Box>
  );
}

// Helper Component for Stat Cards
const StatCard = ({ title, value, icon, color, bgColor }: any) => (
  <Paper 
    elevation={0} 
    sx={{ 
      p: 2.5, 
      borderRadius: 3, 
      display: 'flex', 
      alignItems: 'center', 
      gap: 2,
      backgroundColor: '#fff',
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
    }}
  >
    <Box sx={{ 
      width: 48, height: 48, borderRadius: 2, 
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: bgColor, color: color
    }}>
      {icon}
    </Box>
    <Box>
      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, mb: 0.5, fontSize: '0.8rem' }}>
        {title}
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em' }}>
        {value}
      </Typography>
    </Box>
  </Paper>
);
