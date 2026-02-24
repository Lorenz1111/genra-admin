import { useEffect, useState } from 'react';
import { 
  Box, Typography, Paper, Button, Chip, IconButton, Tooltip, Dialog, 
  DialogTitle, DialogContent, DialogContentText, DialogActions, Snackbar, Alert 
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { CheckCircle, Cancel, Visibility, Inbox } from '@mui/icons-material';
import { supabase } from '../../lib/supabaseClient';

interface BookWithAuthor {
  id: string;
  title: string;
  book_genres: { genres: { name: string } }[]; 
  status: string;
  cover_url: string | null;
  description: string | null;
  created_at: string;
  profiles: {
    full_name: string | null;
  } | null;
}

export default function ReviewCenter() {
  const [books, setBooks] = useState<BookWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States para sa Modals at Alerts
  const [selectedBook, setSelectedBook] = useState<BookWithAuthor | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean, id: string, decision: 'approved' | 'rejected' } | null>(null);
  const [toast, setToast] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const fetchPendingBooks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('books')
      .select(`
        *, 
        profiles(full_name),
        book_genres (
          genres ( name )
        )
      `)
      .eq('status', 'pending_review')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching pending books:', error);
      setBooks([]);
    } else {
      setBooks((data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPendingBooks();
  }, []);

  // --- SENIOR DEV UX: Custom Confirmation Modal imbes na window.confirm ---
  const handleDecision = async () => {
    if (!confirmDialog) return;
    const { id, decision } = confirmDialog;

    const { error } = await supabase
      .from('books')
      .update({ status: decision })
      .eq('id', id);

    if (error) {
      setToast({ open: true, message: 'Error updating status', severity: 'error' });
    } else {
      setBooks(prev => prev.filter(book => book.id !== id));
      setToast({ open: true, message: `Book successfully ${decision}!`, severity: 'success' });
    }
    setConfirmDialog(null);
  };

  const columns: GridColDef[] = [
    { 
      field: 'cover_url', 
      headerName: 'Cover', 
      width: 80,
      renderCell: (params: GridRenderCellParams) => (
        <img 
          src={params.value as string || 'https://via.placeholder.com/50'} 
          alt="cover" 
          style={{ width: 40, height: 60, objectFit: 'cover', borderRadius: 4, marginTop: 4 }}
        />
      )
    },
    { 
      field: 'title', 
      headerName: 'Title', 
      flex: 1, 
      minWidth: 200,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a', mt: 2.5 }}>
          {params.value}
        </Typography>
      )
    },
    { 
      field: 'author', 
      headerName: 'Author', 
      width: 180,
      valueGetter: (_value, row) => row.profiles?.full_name || 'Unknown',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: '#475569', mt: 2.5 }}>
          {params.value}
        </Typography>
      )
    },
    { 
      field: 'genre', 
      headerName: 'Genres', 
      width: 200,
      renderCell: (params: GridRenderCellParams) => {
        const genres = params.row.book_genres
          ?.map((bg: any) => bg.genres?.name)
          .join(', ');
        return (
          <Typography variant="body2" sx={{ color: '#64748b', mt: 2.5, fontStyle: genres ? 'normal' : 'italic' }}>
            {genres || 'No genre assigned'}
          </Typography>
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 160,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
          <Tooltip title="View Details" arrow>
            <IconButton 
              size="small" 
              onClick={() => setSelectedBook(params.row as BookWithAuthor)}
              sx={{ backgroundColor: '#eff6ff', color: '#2563eb', '&:hover': { backgroundColor: '#dbeafe' } }}
            >
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Approve Book" arrow>
            <IconButton 
              size="small" 
              onClick={() => setConfirmDialog({ open: true, id: params.row.id, decision: 'approved' })}
              sx={{ backgroundColor: '#ecfdf5', color: '#16a34a', '&:hover': { backgroundColor: '#d1fae5' } }}
            >
              <CheckCircle fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reject Book" arrow>
            <IconButton 
              size="small" 
              onClick={() => setConfirmDialog({ open: true, id: params.row.id, decision: 'rejected' })}
              sx={{ backgroundColor: '#fef2f2', color: '#dc2626', '&:hover': { backgroundColor: '#fee2e2' } }}
            >
              <Cancel fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', pb: 8 }}>
      
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em', mb: 0.5 }}>
          Review Center
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b' }}>
          Evaluate pending e-books. Ensure content meets GenrA guidelines before publishing.
        </Typography>
      </Box>

      {/* Table Area */}
      <Paper 
        elevation={0} 
        sx={{ 
          height: 500, width: '100%', borderRadius: 3, 
          border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden'
        }}
      >
        <DataGrid
          rows={books}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          slots={{
            // Custom Empty State pag walang pending
            noRowsOverlay: () => (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                <Inbox sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#64748b' }}>All caught up!</Typography>
                <Typography variant="body2">There are no pending books to review.</Typography>
              </Box>
            )
          }}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f8fafc', color: '#475569', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' },
            '& .MuiDataGrid-cell': { borderColor: '#f1f5f9' }
          }}
        />
      </Paper>

      {/* ======================================================= */}
      {/* MODALS AND NOTIFICATIONS                                  */}
      {/* ======================================================= */}

      {/* 1. Book Details Modal */}
      <Dialog open={!!selectedBook} onClose={() => setSelectedBook(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: '#0f172a', borderBottom: '1px solid #e2e8f0', pb: 2 }}>
          {selectedBook?.title}
        </DialogTitle>
        <DialogContent sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
            <img 
              src={selectedBook?.cover_url || ''} 
              alt="cover" 
              style={{ width: 120, height: 180, objectFit: 'cover', borderRadius: 8, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
            />
            <Box>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Author</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#0f172a', mb: 2 }}>
                {selectedBook?.profiles?.full_name || 'Unknown'}
              </Typography>
              
              <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Genres</Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                {selectedBook?.book_genres && selectedBook.book_genres.length > 0 ? (
                  selectedBook.book_genres.map((bg: any, index: number) => (
                    <Chip key={index} label={bg.genres?.name} size="small" sx={{ backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 500 }} />
                  ))
                ) : (
                  <Chip label="None" size="small" />
                )}
              </Box>
            </Box>
          </Box>
          
          <Box sx={{ p: 2, backgroundColor: '#f8fafc', borderRadius: 2 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Synopsis / Description</Typography>
            <Typography variant="body2" sx={{ color: '#475569', mt: 1, whiteSpace: 'pre-wrap' }}>
              {selectedBook?.description || 'No description provided.'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={() => setSelectedBook(null)} sx={{ color: '#64748b' }}>Close</Button>
          <Button 
            variant="contained" 
            sx={{ backgroundColor: '#16a34a', '&:hover': { backgroundColor: '#15803d' }, boxShadow: 'none' }} 
            onClick={() => {
              if (selectedBook) {
                setConfirmDialog({ open: true, id: selectedBook.id, decision: 'approved' });
                setSelectedBook(null);
              }
            }}
          >
            Approve Now
          </Button>
        </DialogActions>
      </Dialog>

      {/* 2. Confirmation Modal (Replaces window.confirm) */}
      <Dialog open={!!confirmDialog} onClose={() => setConfirmDialog(null)}>
        <DialogTitle sx={{ fontWeight: 'bold', color: confirmDialog?.decision === 'approved' ? '#16a34a' : '#dc2626' }}>
          {confirmDialog?.decision === 'approved' ? 'Approve Book?' : 'Reject Book?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to {confirmDialog?.decision} this book? 
            {confirmDialog?.decision === 'approved' ? " It will be visible to all readers." : " The author will be notified."}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(null)} sx={{ color: '#64748b' }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleDecision}
            sx={{ 
              backgroundColor: confirmDialog?.decision === 'approved' ? '#16a34a' : '#dc2626',
              boxShadow: 'none'
            }}
          >
            Confirm {confirmDialog?.decision}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 3. Success/Error Toast (Replaces window.alert) */}
      <Snackbar 
        open={toast.open} 
        autoHideDuration={4000} 
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setToast({ ...toast, open: false })} severity={toast.severity} sx={{ width: '100%', boxShadow: 3 }}>
          {toast.message}
        </Alert>
      </Snackbar>

    </Box>
  );
}