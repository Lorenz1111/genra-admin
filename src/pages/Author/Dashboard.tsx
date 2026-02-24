import { useEffect, useState } from 'react';
import { Box, Typography, Grid, Paper, CircularProgress, Avatar, Button } from '@mui/material';
import { TrendingUp, MenuBook, StarBorder, AddCircleOutline, ListAlt } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
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
  const [topBooks, setTopBooks] = useState<Book[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!session) return;

      const { data: books, error } = await supabase
        .from('books')
        .select('*')
        .eq('author_id', session.user.id)
        .order('views_count', { ascending: false }); 

      if (error) {
        console.error('Error fetching analytics:', error);
      } else if (books) {
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

        setTopBooks(books.slice(0, 5));
      }
      
      setLoading(false);
    };

    fetchAnalytics();
  }, [session]);

  const columns: GridColDef[] = [
    { field: 'title', headerName: 'Book Title', flex: 1, minWidth: 200 },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 140,
      renderCell: (params) => {
        const status = params.value as string;
        let bgColor = '#f1f5f9';
        let textColor = '#64748b';

        if (status === 'approved') {
          bgColor = '#dcfce7'; textColor = '#16a34a';
        } else if (status === 'pending_review') {
          bgColor = '#ffedd5'; textColor = '#ea580c';
        } else if (status === 'rejected') {
          bgColor = '#fee2e2'; textColor = '#dc2626';
        }

        return (
          <Box sx={{ 
            backgroundColor: bgColor, color: textColor,
            px: 1, py: 0.5, borderRadius: 1, display: 'inline-block',
            fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5
          }}>
            {status.replace('_', ' ')}
          </Box>
        );
      }
    },
    { field: 'views_count', headerName: 'Views', width: 100, type: 'number' },
    { 
      field: 'rating', 
      headerName: 'Rating', 
      width: 100,
      valueFormatter: (params) => params.value ? Number(params.value).toFixed(1) : '0.0'
    },
  ];

  if (loading) {
    return (
      <Box className="flex items-center justify-center h-[80vh]">
        <CircularProgress sx={{ color: '#2563eb' }} />
      </Box>
    );
  }

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

        {/* BAGONG FEATURE: Quick Actions */}
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
             value={totalViews.toLocaleString()} 
             icon={<TrendingUp fontSize="large" />} 
             color="#2563eb" 
             bgColor="#eff6ff" 
           />
        </Grid>
        <Grid item xs={12} md={4}>
           <StatCard 
             title="Published Books" 
             value={totalBooks.toString()} 
             icon={<MenuBook fontSize="large" />} 
             color="#10b981" 
             bgColor="#ecfdf5" 
           />
        </Grid>
        <Grid item xs={12} md={4}>
           <StatCard 
             title="Average Rating" 
             value={avgRating > 0 ? avgRating.toFixed(1) : '0.0'} 
             icon={<StarBorder fontSize="large" />} 
             color="#f59e0b" 
             bgColor="#fffbeb" 
           />
        </Grid>
      </Grid>

      {/* --- TOP PERFORMING BOOKS TABLE (Standard Design) --- */}
      <Typography variant="h6" sx={{ fontWeight: '800', color: '#0f172a', mb: 2, letterSpacing: '-0.01em' }}>
        Top Performing Books
      </Typography>
      
      {/* Ibinalik natin sa standard Paper elevation para same look sa Mybooks.tsx */}
      <Paper elevation={2} sx={{ height: 400, width: '100%', borderRadius: 2 }}>
        <DataGrid
          rows={topBooks}
          columns={columns}
          hideFooterPagination
          disableRowSelectionOnClick
        />
      </Paper>
    </Box>
  );
}

// Helper Component for Stat Cards
const StatCard = ({ title, value, icon, color, bgColor }: any) => (
  <Paper 
    elevation={2} 
    sx={{ 
      p: 3, 
      borderRadius: 2, 
      display: 'flex', 
      alignItems: 'center', 
      gap: 2.5,
      backgroundColor: '#fff',
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