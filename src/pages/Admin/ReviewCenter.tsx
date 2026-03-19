import { useEffect, useState } from 'react';
import { 
  Box, Typography, Paper, Button, Chip, IconButton, Tooltip, Dialog, 
  DialogTitle, DialogContent, DialogContentText, DialogActions, Snackbar, Alert, 
  TextField, Skeleton 
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { CheckCircle, Cancel, Visibility, Inbox, MenuBook } from '@mui/icons-material';
import { supabase } from '../../lib/supabaseClient';

interface BookWithAuthor {
  id: string;
  title: string;
  book_genres: { genres: { name: string } }[]; 
  status: string;
  cover_url: string | null;
  file_url?: string | null; 
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
  const [rejectionReason, setRejectionReason] = useState(''); 
  const [toast, setToast] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const fetchPendingBooks = async () => {
    setLoading(true);
    try {
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
        // SD Feature: FIFO - Oldest pending first
        .order('created_at', { ascending: true })
        // SD Request: Limit to 20 rows
        .limit(20);

      if (error) throw error;
      setBooks((data as any) || []);
    } catch (error) {
      console.error('Error fetching pending books:', error);
      setToast({ open: true, message: 'Failed to load review queue.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingBooks();
  }, []);

  const handleDecision = async () => {
    if (!confirmDialog) return;
    const { id, decision } = confirmDialog;

    if (decision === 'rejected' && !rejectionReason.trim()) {
      setToast({ open: true, message: 'Please provide a reason for rejection.', severity: 'error' });
      return;
    }

    try {
      const payload: any = { status: decision };
      if (decision === 'rejected') {
        payload.rejection_reason = rejectionReason.trim(); 
      }

      const { error } = await supabase
        .from('books')
        .update(payload)
        .eq('id', id);

      if (error) throw error;

      setBooks(prev => prev.filter(book => book.id !== id));
      setToast({ open: true, message: `Book successfully ${decision}!`, severity: 'success' });
    } catch (error: any) {
      setToast({ open: true, message: error.message || 'Error updating status', severity: 'error' });
    } finally {
      setConfirmDialog(null);
      setRejectionReason(''); 
    }
  };

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
      headerName: 'Title', 
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
    { 
      field: 'author', 
      headerName: 'Author', 
      width: 180,
      valueGetter: (_value, row) => row.profiles?.full_name || 'Unknown',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
          <Typography variant="body2" sx={{ color: '#475569' }}>
            {params.value}
          </Typography>
        </Box>
      )
    },
    { 
      field: 'genre', 
      headerName: 'Genres', 
      width: 200,
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
    // SD Request: Date Uploaded Column Added
    {
      field: 'created_at',
      headerName: 'Date Uploaded',
      width: 140,
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
      field: 'actions',
      headerName: 'Actions',
      width: 160,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: '100%' }}>
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
          height: 600, width: '100%', borderRadius: 3, 
          border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden'
        }}
      >
        <DataGrid
          rows={books}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          rowHeight={65}
          // SD Feature: Added Pagination para malinis ang 20 rows limit
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10, page: 0 },
            },
          }}
          pageSizeOptions={[5, 10, 20]}
          slots={{
            // SD Request: Consistent Row/Chip Skeleton Loading applied here
            loadingOverlay: () => (
              <Box sx={{ p: 2 }}>
                {[1, 2, 3, 4, 5].map((item) => (
                  <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, borderBottom: '1px solid #f1f5f9', pb: 1.5 }}>
                    <Skeleton variant="rectangular" width={40} height={56} sx={{ borderRadius: 1 }} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="60%" height={24} />
                      <Skeleton variant="text" width="40%" height={16} />
                    </Box>
                    <Skeleton variant="rectangular" width={100} height={24} sx={{ borderRadius: 1.5 }} />
                    <Skeleton variant="text" width={120} height={24} />
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
                <Inbox sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#64748b' }}>All caught up!</Typography>
                <Typography variant="body2">There are no pending books to review.</Typography>
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
      {/* MODALS AND NOTIFICATIONS                                  */}
      {/* ======================================================= */}

      {/* 1. Book Details Modal */}
      <Dialog open={!!selectedBook} onClose={() => setSelectedBook(null)} maxWidth="sm" fullWidth scroll="paper">
        <DialogTitle sx={{ fontWeight: 'bold', color: '#0f172a', borderBottom: '1px solid #e2e8f0', pb: 2 }}>
          {selectedBook?.title}
        </DialogTitle>
        <DialogContent sx={{ mt: 3, pb: 4 }}>
          <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
            <img 
              src={selectedBook?.cover_url || 'https://via.placeholder.com/120x180?text=No+Cover'} 
              alt="cover" 
              style={{ width: 120, height: 180, objectFit: 'cover', borderRadius: 8, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
            />
            <Box>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Author</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: '#0f172a', mb: 2 }}>
                {selectedBook?.profiles?.full_name || 'Unknown'}
              </Typography>
              
              <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Genres</Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5, mb: 2 }}>
                {selectedBook?.book_genres && selectedBook.book_genres.length > 0 ? (
                  selectedBook.book_genres.map((bg: any, index: number) => (
                    <Chip key={index} label={bg.genres?.name} size="small" sx={{ backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 600, fontSize: '0.7rem' }} />
                  ))
                ) : (
                  <Chip label="None" size="small" sx={{ color: '#94a3b8' }} />
                )}
              </Box>

              <Button 
                variant="outlined" 
                startIcon={<MenuBook />}
                size="small"
                disabled={!selectedBook?.file_url}
                onClick={() => {
                  if (selectedBook?.file_url) {
                    window.open(selectedBook.file_url, '_blank');
                  }
                }}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
              >
                {selectedBook?.file_url ? 'Read Manuscript' : 'No File Uploaded'}
              </Button>
            </Box>
          </Box>
          
          <Box sx={{ p: 2, backgroundColor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Synopsis / Description</Typography>
            <Typography variant="body2" sx={{ color: '#475569', mt: 1, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {selectedBook?.description || 'No description provided.'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0', justifyContent: 'space-between' }}>
          <Button 
            variant="outlined" 
            color="error"
            onClick={() => {
              if (selectedBook) {
                setConfirmDialog({ open: true, id: selectedBook.id, decision: 'rejected' });
                setSelectedBook(null);
              }
            }}
            sx={{ fontWeight: 'bold', borderRadius: 2, textTransform: 'none' }}
          >
            Reject Book
          </Button>
          <Box>
            <Button onClick={() => setSelectedBook(null)} sx={{ color: '#64748b', mr: 1, fontWeight: 'bold' }}>Close</Button>
            <Button 
              variant="contained" 
              sx={{ backgroundColor: '#16a34a', '&:hover': { backgroundColor: '#15803d' }, boxShadow: 'none', fontWeight: 'bold', borderRadius: 2, textTransform: 'none' }} 
              onClick={() => {
                if (selectedBook) {
                  setConfirmDialog({ open: true, id: selectedBook.id, decision: 'approved' });
                  setSelectedBook(null);
                }
              }}
            >
              Approve Now
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* 2. Confirmation Modal */}
      <Dialog open={!!confirmDialog} onClose={() => setConfirmDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: confirmDialog?.decision === 'approved' ? '#16a34a' : '#dc2626' }}>
          {confirmDialog?.decision === 'approved' ? 'Approve Book?' : 'Reject Book?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: confirmDialog?.decision === 'rejected' ? 2 : 0 }}>
            Are you sure you want to {confirmDialog?.decision} this book? 
            {confirmDialog?.decision === 'approved' ? " It will be visible to all readers." : " The author will be notified."}
          </DialogContentText>
          
          {confirmDialog?.decision === 'rejected' && (
            <TextField
              autoFocus
              margin="dense"
              label="Reason for Rejection"
              placeholder="e.g., Inappropriate content, formatting issues..."
              type="text"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              required
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmDialog(null)} sx={{ color: '#64748b', fontWeight: 'bold' }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleDecision}
            sx={{ 
              backgroundColor: confirmDialog?.decision === 'approved' ? '#16a34a' : '#dc2626',
              '&:hover': { backgroundColor: confirmDialog?.decision === 'approved' ? '#15803d' : '#b91c1c' },
              boxShadow: 'none',
              fontWeight: 'bold'
            }}
          >
            Confirm {confirmDialog?.decision}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 3. Success/Error Toast */}
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