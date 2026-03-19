import { useEffect, useState } from 'react';
import { 
  Box, Typography, Paper, Avatar, Button, Chip, Skeleton, Tooltip 
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { TrendingUp, MenuBook, StarBorder, AddCircleOutline, ListAlt, LibraryBooks } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { Database } from '../../types/supabase';

type Book = Database['public']['Tables']['books']['Row'];

export default function AuthorDashboard() {
  const { session, profile } = useAuth(); 
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  
  const [totalBooks, setTotalBooks] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [topBooks, setTopBooks] = useState<any[]>([]); // Ginamit ang any muna para pumasok ang nested genre relation

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!session) return;

      try {
        // SD Fix: Isinama natin ang book_genres para makuha ang mga pangalan ng genre
        const { data: books, error } = await supabase
          .from('books')
          .select('*, book_genres(genres(name))')
          .eq('author_id', session.user.id)
          .order('views_count', { ascending: false }); 

        if (error) throw error;

        if (books) {
          setTotalBooks(books.length);
          
          const views = books.reduce((sum, book) => sum + (book.views_count || 0), 0);
          setTotalViews(views);

          const booksWithRatings = books.filter(book => book.rating && book.rating > 0);
          if (booksWithRatings.length > 0) {
            const totalRatingSum = booksWithRatings.reduce((sum, book) => sum + (book.rating || 0), 0);
            setAvgRating(totalRatingSum / booksWithRatings.length);
          } else {
            setAvgRating(0); 
          }

          // Imbes na i-slice sa 5, ipapasa natin lahat para gumana ang pagination
          setTopBooks(books);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [session]);

  const columns: GridColDef[] = [
    // SD Feature: Cover Book Column
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
      headerName: 'Book Title', 
      flex: 1, 
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
            {params.value}
          </Typography>
        </Box>
      )
    },
    // SD Feature: Genres Column with Tooltip
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
    // SD Feature: Date Uploaded Column
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
      field: 'views_count', 
      headerName: 'Views', 
      width: 90, 
      type: 'number',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
            {(params.value as number | null)?.toLocaleString() || 0}
          </Typography>
        </Box>
      )
    },
    { 
      field: 'rating', 
      headerName: 'Rating', 
      width: 90,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', gap: 0.5 }}>
          <StarBorder sx={{ fontSize: 16, color: '#f59e0b' }} />
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
            {Number(params.value ?? 0).toFixed(1)}
          </Typography>
        </Box>
      )
    },
  ];

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', pb: 8 }}>
      
      {/* --- WELCOME HEADER & QUICK ACTIONS --- */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, mb: 5, gap: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Avatar sx={{ width: 64, height: 64, bgcolor: '#eff6ff', color: '#2563eb', fontSize: '1.75rem', fontWeight: 'bold' }}>
            {profile?.full_name?.charAt(0) || 'A'}
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em', mb: 0.5 }}>
              Welcome back, {profile?.full_name || 'Author'}
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b' }}>
              Here is an overview of your books and analytics today.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<ListAlt />} 
            onClick={() => navigate('/author/books')}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold', borderColor: '#cbd5e1', color: '#475569' }}
          >
            Manage Books
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddCircleOutline />} 
            onClick={() => navigate('/author/upload')}
            sx={{ borderRadius: 2, backgroundColor: '#2563eb', textTransform: 'none', fontWeight: 'bold', boxShadow: 'none' }}
          >
            Upload New
          </Button>
        </Box>
      </Box>

      {/* --- STATS CARDS --- */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        <Grid item xs={12} md={4}>
           <StatCard 
             title="Total Views" 
             value={loading ? '-' : totalViews.toLocaleString()} 
             icon={<TrendingUp fontSize="large" />} 
             color="#2563eb" bgColor="#eff6ff" 
           />
        </Grid>
        <Grid item xs={12} md={4}>
           <StatCard 
             title="Published Books" 
             value={loading ? '-' : totalBooks.toString()} 
             icon={<MenuBook fontSize="large" />} 
             color="#10b981" bgColor="#ecfdf5" 
           />
        </Grid>
        <Grid item xs={12} md={4}>
           <StatCard 
             title="Average Rating" 
             value={loading ? '-' : (avgRating > 0 ? avgRating.toFixed(1) : '0.0')} 
             icon={<StarBorder fontSize="large" />} 
             color="#f59e0b" bgColor="#fffbeb" 
           />
        </Grid>
      </Grid>

      {/* --- TOP PERFORMING BOOKS TABLE --- */}
      <Typography variant="h6" sx={{ fontWeight: '800', color: '#0f172a', mb: 2, letterSpacing: '-0.01em' }}>
        Top Performing Books
      </Typography>
      
      {/* SD FIX: Tinaasan ko height to 650 para kasya ang 10 rows nang maayos */}
      <Paper 
        elevation={0} 
        sx={{ 
          height: 650, width: '100%', borderRadius: 3, 
          border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden'
        }}
      >
        <DataGrid
          rows={topBooks}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          rowHeight={60} 
          // SD FEATURE: Setup Pagination to 10 Rows Limit
          initialState={{
            columns: {
              columnVisibilityModel: {
                status: false
              }
            },
            pagination: { paginationModel: { pageSize: 10, page: 0 } },
          }}
          pageSizeOptions={[5, 10, 20]}
          slots={{
            // SD FEATURE: Solid Skeleton Loading Katulad ng mga nauna
            loadingOverlay: () => (
              <Box sx={{ p: 2 }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((item) => (
                  <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, borderBottom: '1px solid #f1f5f9', pb: 1.5 }}>
                    <Skeleton variant="rectangular" width={40} height={56} sx={{ borderRadius: 1 }} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="50%" height={24} />
                      <Skeleton variant="text" width="30%" height={16} />
                    </Box>
                    <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1.5 }} />
                    <Skeleton variant="text" width={80} height={24} />
                  </Box>
                ))}
              </Box>
            ),
            noRowsOverlay: () => (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                <LibraryBooks sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#64748b' }}>No analytics yet</Typography>
                <Typography variant="body2">Publish a book to start tracking views.</Typography>
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
      p: 3, 
      borderRadius: 3, 
      display: 'flex', 
      alignItems: 'center', 
      gap: 2.5,
      backgroundColor: '#fff',
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
    }}
  >
    <Box sx={{ 
      width: 56, height: 56, borderRadius: 2, 
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: bgColor, color: color
    }}>
      {icon}
    </Box>
    <Box>
      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, mb: 0.5, fontSize: '0.85rem' }}>
        {title}
      </Typography>
      <Typography variant="h4" sx={{ fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em' }}>
        {value}
      </Typography>
    </Box>
  </Paper>
);
