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

export default function AuthorDashboard() {
  const { session, profile } = useAuth(); 
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [totalBooks, setTotalBooks] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [topBooks, setTopBooks] = useState<any[]>([]); 

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!session) return;
      try {
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
    { 
      field: 'cover_url', headerName: 'Cover', width: 70, sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <img src={params.value as string || 'https://via.placeholder.com/50'} alt="cover" style={{ width: 40, height: 56, objectFit: 'cover', borderRadius: 4, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
        </Box>
      )
    },
    { 
      field: 'title', headerName: 'Book Title', flex: 1, minWidth: 200, 
      renderCell: (params) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.2, whiteSpace: 'normal', wordWrap: 'break-word', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {params.value}
          </Typography>
        </Box>
      )
    },
    { 
      field: 'genre', headerName: 'Genres', width: 160, sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        const genres = (params.row.book_genres?.map((bg: any) => bg.genres?.name).filter(Boolean) as string[]) || [];
        const displayGenres = genres.slice(0, 1); 
        const extraGenres = genres.slice(1);

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5, height: '100%' }}>
            {displayGenres.length > 0 ? (
              <>
                {displayGenres.map((genre: string, index: number) => (<Chip key={index} label={genre} size="small" sx={{ backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 600, fontSize: '0.65rem', borderRadius: 1.5 }} />))}
                {extraGenres.length > 0 && (
                  <Tooltip title={extraGenres.join(', ')} arrow placement="top">
                    <Chip label={`+${extraGenres.length}`} size="small" sx={{ backgroundColor: '#e2e8f0', color: '#475569', fontWeight: 'bold', fontSize: '0.65rem', cursor: 'pointer', borderRadius: 1.5 }} />
                  </Tooltip>
                )}
              </>
            ) : (<Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>None</Typography>)}
          </Box>
        );
      }
    },
    { 
      field: 'status', headerName: 'Status', width: 120,
      renderCell: (params: GridRenderCellParams) => {
        const status = (params.value as string | null) || 'unknown';
        let bgColor = '#f1f5f9'; let textColor = '#64748b';
        if (status === 'approved' || status === 'published') { bgColor = '#dcfce7'; textColor = '#15803d'; } 
        else if (status === 'pending_review' || status === 'pending') { bgColor = '#ffedd5'; textColor = '#ea580c'; } 
        else if (status === 'rejected' || status === 'archived') { bgColor = '#fee2e2'; textColor = '#b91c1c'; }

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Chip label={String(status).replace('_', ' ')} size="small" sx={{ backgroundColor: bgColor, color: textColor, fontWeight: 'bold', textTransform: 'capitalize', borderRadius: 1.5, fontSize: '0.65rem' }} />
          </Box>
        );
      }
    },
    {
      field: 'created_at', headerName: 'Uploaded', width: 110,
      renderCell: (params) => {
        const date = params.value ? new Date(params.value as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500, fontSize: '0.8rem' }}>
              {date}
            </Typography>
          </Box>
        );
      }
    },
    { 
      field: 'views_count', headerName: 'Views', width: 80, type: 'number',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>
            {(params.value as number | null)?.toLocaleString() || 0}
          </Typography>
        </Box>
      )
    },
    { 
      field: 'rating', headerName: 'Rates', width: 80,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', gap: 0.5 }}>
          <StarBorder sx={{ fontSize: 16, color: '#f59e0b' }} />
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>
            {Number(params.value ?? 0).toFixed(1)}
          </Typography>
        </Box>
      )
    },
  ];

  return (
    // SD FIX: Eksaktong kapareho ng UploadBook.tsx container
    <Box sx={{ maxWidth: '1200px', pb: 8 }}>
      
      {/* --- WELCOME HEADER & QUICK ACTIONS --- */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, mb: { xs: 3, md: 5 }, gap: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: { xs: 48, md: 64 }, height: { xs: 48, md: 64 }, bgcolor: '#eff6ff', color: '#2563eb', fontSize: { xs: '1.25rem', md: '1.75rem' }, fontWeight: 'bold' }}>
            {profile?.full_name?.charAt(0) || 'A'}
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em', mb: 0.5, fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
              Welcome, {profile?.full_name?.split(' ')[0] || 'Author'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Here is your books overview.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', md: 'auto' } }}>
          <Button fullWidth variant="outlined" startIcon={<ListAlt />} onClick={() => navigate('/author/books')} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold', borderColor: '#cbd5e1', color: '#475569' }}>Manage</Button>
          <Button fullWidth variant="contained" startIcon={<AddCircleOutline />} onClick={() => navigate('/author/upload')} sx={{ borderRadius: 2, backgroundColor: '#2563eb', textTransform: 'none', fontWeight: 'bold', boxShadow: 'none' }}>Upload</Button>
        </Box>
      </Box>

      {/* --- STATS CARDS --- */}
      <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mb: { xs: 4, md: 6 } }}>
        <Grid item xs={12} sm={4}>
           <StatCard title="Total Views" value={loading ? '-' : totalViews.toLocaleString()} icon={<TrendingUp />} color="#2563eb" bgColor="#eff6ff" />
        </Grid>
        <Grid item xs={6} sm={4}>
           <StatCard title="Books" value={loading ? '-' : totalBooks.toString()} icon={<MenuBook />} color="#10b981" bgColor="#ecfdf5" />
        </Grid>
        <Grid item xs={6} sm={4}>
           <StatCard title="Rating" value={loading ? '-' : (avgRating > 0 ? avgRating.toFixed(1) : '0.0')} icon={<StarBorder />} color="#f59e0b" bgColor="#fffbeb" />
        </Grid>
      </Grid>

      {/* --- TOP PERFORMING BOOKS TABLE --- */}
      <Typography variant="h6" sx={{ fontWeight: '800', color: '#0f172a', mb: 2, letterSpacing: '-0.01em', fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
        Top Performing Books
      </Typography>
      
      {/* SD BULLETPROOF FIX: Native Horizontal Scroll Wrapper */}
      <Paper 
        elevation={0} 
        sx={{ 
          width: '100%', 
          borderRadius: 3, 
          border: '1px solid #e2e8f0', 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden' // Pinipigilan pumangit yung rounded corners
        }}
      >
        {/* Ito ang gagawa ng scrollbar pakanan sa mismong loob ng table box */}
        <Box sx={{ width: '100%', overflowX: 'auto' }}>
          
          {/* Ito yung nagbibigay space sa DataGrid para hindi siya magmukhang spaghetti text */}
          <Box sx={{ minWidth: 900, height: { xs: 500, md: 650 } }}>
            <DataGrid
              rows={topBooks}
              columns={columns}
              loading={loading}
              disableRowSelectionOnClick
              rowHeight={65} 
              initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
              pageSizeOptions={[5, 10, 20]}
              slots={{
                loadingOverlay: () => (
                  <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((item) => (
                      <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 2, borderBottom: '1px solid #f1f5f9', pb: 1.5 }}>
                        <Skeleton variant="rectangular" width={40} height={56} sx={{ borderRadius: 1 }} />
                        <Box sx={{ flex: 1 }}><Skeleton variant="text" width="70%" height={24} /><Skeleton variant="text" width="40%" height={16} /></Box>
                        <Skeleton variant="rectangular" width={100} height={24} sx={{ borderRadius: 1.5 }} />
                      </Box>
                    ))}
                  </Box>
                ),
                noRowsOverlay: () => (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                    <LibraryBooks sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#64748b' }}>No analytics yet</Typography>
                    <Typography variant="body2" sx={{ textAlign: 'center', px: 2 }}>Publish a book to start tracking views.</Typography>
                  </Box>
                )
              }}
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f8fafc', color: '#475569', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' },
                '& .MuiDataGrid-cell': { borderColor: '#f1f5f9' },
                '& .MuiTablePagination-root': { color: '#475569', borderTop: '1px solid #e2e8f0' }
              }}
            />
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

const StatCard = ({ title, value, icon, color, bgColor }: any) => (
  <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 2.5 }, backgroundColor: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
    <Box sx={{ width: { xs: 40, md: 56 }, height: { xs: 40, md: 56 }, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: bgColor, color: color }}>{icon}</Box>
    <Box>
      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, mb: 0.5, fontSize: { xs: '0.7rem', md: '0.85rem' } }}>{title}</Typography>
      <Typography variant="h5" sx={{ fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em', fontSize: { xs: '1.25rem', md: '1.75rem' } }}>{value}</Typography>
    </Box>
  </Paper>
);