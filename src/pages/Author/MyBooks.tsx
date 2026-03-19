import { useEffect, useState } from 'react';
import { 
  Box, Typography, Paper, Button, IconButton, Tooltip, Chip, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, Snackbar, Alert, CircularProgress, 
  FormControl, InputLabel, Select, MenuItem, OutlinedInput, Skeleton 
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { DataGrid, GridToolbarContainer } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { 
  AddCircleOutline, Edit, FormatListBulleted, LibraryBooks, 
  CloudUpload, VisibilityOff, StarBorder, WarningAmber 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import type { Database } from '../../types/supabase';

type Book = Database['public']['Tables']['books']['Row'];

interface Genre {
  id: string;
  name: string;
}

export default function MyBooks() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>([]);
  const [availableGenres, setAvailableGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);

  // --- EDIT MODAL STATES ---
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editBookId, setEditBookId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSelectedGenres, setEditSelectedGenres] = useState<string[]>([]);
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
  const [editCoverPreview, setEditCoverPreview] = useState<string | null>(null);

  // --- ARCHIVE / HIDE STATES ---
  const [archiveDialog, setArchiveDialog] = useState<{ open: boolean, id: string, title: string } | null>(null);
  const [archiveConfirmationText, setArchiveConfirmationText] = useState('');

  const [toast, setToast] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const showTableLoader = loading && books.length === 0;

  useEffect(() => {
    const fetchData = async () => {
      if (!session) return;
      setLoading(true);

      // SD Update: Fetching created_at, updated_at, rating
      const { data: booksData, error: booksError } = await supabase
        .from('books')
        .select(`
          *,
          book_genres ( genre_id, genres ( id, name ) ),
          chapters ( id )
        `)
        .eq('author_id', session.user.id)
        .order('created_at', { ascending: false });

      if (booksError) {
        console.error('Error fetching books:', booksError);
      } else {
        setBooks(booksData as any || []);
      }

      const { data: genresData } = await supabase.from('genres').select('id, name').order('name', { ascending: true });
      if (genresData) setAvailableGenres(genresData);

      setLoading(false);
    };

    fetchData();
  }, [session]);

  const showToast = (message: string, severity: 'success' | 'error') => {
    setToast({ open: true, message, severity });
  };

  const handleOpenEdit = (book: any) => {
    setEditBookId(book.id);
    setEditTitle(book.title);
    setEditDescription(book.description || '');
    setEditCoverPreview(book.cover_url);
    setEditCoverFile(null); 
    
    const currentGenreIds = book.book_genres?.map((bg: any) => bg.genre_id || bg.genres?.id) || [];
    setEditSelectedGenres(currentGenreIds);
    setEditModalOpen(true);
  };

  const handleCloseEdit = () => {
    setEditModalOpen(false);
    setEditBookId(null);
  };

  const handleCloseArchiveDialog = () => {
    setArchiveDialog(null);
    setArchiveConfirmationText('');
  };

  const handleGenreChange = (event: SelectChangeEvent<typeof editSelectedGenres>) => {
    const { target: { value } } = event;
    setEditSelectedGenres(typeof value === 'string' ? value.split(',') : value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditCoverFile(file);
      setEditCoverPreview(URL.createObjectURL(file)); 
    }
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim() || !editDescription.trim()) {
      showToast('Title and Description are required.', 'error');
      return;
    }
    if (editSelectedGenres.length === 0) {
      showToast('Please select at least one genre.', 'error');
      return;
    }

    setEditLoading(true);
    try {
      let finalCoverUrl = editCoverPreview;

      if (editCoverFile && session) {
        const fileExt = editCoverFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${session.user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage.from('public_assets').upload(filePath, editCoverFile);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('public_assets').getPublicUrl(filePath);
        finalCoverUrl = publicUrl;
      }

      const { error: updateError } = await supabase
        .from('books')
        .update({ title: editTitle.trim(), description: editDescription.trim(), cover_url: finalCoverUrl })
        .eq('id', editBookId as string);

      if (updateError) throw updateError;

      await supabase.from('book_genres').delete().eq('book_id', editBookId as string);
      
      const genreInserts = editSelectedGenres.map(genreId => ({ book_id: editBookId as string, genre_id: genreId }));
      const { error: genreError } = await supabase.from('book_genres').insert(genreInserts);
      if (genreError) throw genreError;

      const newBookGenresObj = editSelectedGenres.map(genreId => {
        const genreDetail = availableGenres.find(g => g.id === genreId);
        return { genre_id: genreId, genres: { id: genreId, name: genreDetail?.name || 'Unknown' } };
      });

      setBooks(prevBooks => prevBooks.map(book => {
        if (book.id === editBookId) {
          return { ...book, title: editTitle.trim(), description: editDescription.trim(), cover_url: finalCoverUrl, book_genres: newBookGenresObj as any };
        }
        return book;
      }));

      showToast('Book details updated successfully!', 'success');
      handleCloseEdit(); 
    } catch (err: any) {
      showToast(err.message || "An error occurred while saving.", 'error');
    } finally {
      setEditLoading(false);
    }
  };

  // SD FEATURE: Archive/Hide Book Logic
  const handleArchiveBook = async () => {
    if (!archiveDialog) return;
    try {
      const { error } = await supabase.from('books').update({ status: 'archived' }).eq('id', archiveDialog.id);
      if (error) throw error;
      
      setBooks(prev => prev.map(b => b.id === archiveDialog.id ? { ...b, status: 'archived' } : b));
      showToast('Book has been hidden from public (Archived).', 'success');
    } catch (error: any) {
      showToast('Error hiding book.', 'error');
    } finally {
      handleCloseArchiveDialog();
    }
  };

  const CustomToolbar = () => (
    <GridToolbarContainer sx={{ p: 2, justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#0f172a' }}>
        My Book Collection
      </Typography>
      <Button 
        variant="contained" 
        size="small"
        startIcon={<AddCircleOutline />} 
        onClick={() => navigate('/author/upload')}
        sx={{ borderRadius: 1.5, backgroundColor: '#2563eb', textTransform: 'none', fontWeight: 'bold', boxShadow: 'none' }}
      >
        Upload New Book
      </Button>
    </GridToolbarContainer>
  );

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
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', gap: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
            {params.value}
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
      field: 'status', 
      headerName: 'Status', 
      width: 140,
      renderCell: (params: GridRenderCellParams) => {
        const status = (params.value as string | null) || 'unknown';
        let bgColor = '#f1f5f9'; let textColor = '#64748b';

        if (status === 'approved' || status === 'published') { bgColor = '#dcfce7'; textColor = '#15803d'; } 
        else if (status === 'pending_review' || status === 'pending') { bgColor = '#ffedd5'; textColor = '#ea580c'; } 
        else if (status === 'rejected' || status === 'archived') { bgColor = '#fee2e2'; textColor = '#b91c1c'; }

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Chip label={String(status).replace('_', ' ')} size="small" sx={{ backgroundColor: bgColor, color: textColor, fontWeight: 'bold', textTransform: 'capitalize', borderRadius: 1.5, fontSize: '0.7rem' }} />
          </Box>
        );
      }
    },
    // SD FEATURE: Date Uploaded
    {
      field: 'created_at',
      headerName: 'Date Uploaded',
      width: 130,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
            {params.value ? new Date(params.value as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
          </Typography>
        </Box>
      )
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
    // SD FEATURE: Date Approved
    {
      field: 'date_approved',
      headerName: 'Date Approved',
      width: 130,
      renderCell: (params) => {
        const isApproved = params.row.status === 'approved' || params.row.status === 'published';
        const dateVal = params.row.updated_at || params.row.created_at;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            {isApproved ? (
              <Typography variant="body2" sx={{ color: '#15803d', fontWeight: 600 }}>
                {dateVal ? new Date(dateVal as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
              </Typography>
            ) : (
              <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>-</Typography>
            )}
          </Box>
        );
      }
    },
    // SD FEATURE: Rating Column
    { 
      field: 'rating', 
      headerName: 'Rates', 
      width: 80,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', gap: 0.5 }}>
          <StarBorder sx={{ fontSize: 16, color: '#f59e0b' }} />
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
            {Number(params.value ?? 0).toFixed(1)}
          </Typography>
        </Box>
      )
    },
    { 
      field: 'chapters_count', 
      headerName: 'Ch.', 
      width: 60, 
      type: 'number',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>{params.row.chapters?.length || 0}</Typography>
        </Box>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 140,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => {
        // Kapag archived na siya, disabled na ang Hide button
        const isArchived = params.row.status === 'archived';

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: '100%' }}>
            <Tooltip title="Manage Chapters" arrow>
              <IconButton size="small" onClick={() => navigate(`/author/books/${params.row.id}/chapters`)} sx={{ backgroundColor: '#eff6ff', color: '#2563eb', '&:hover': { backgroundColor: '#dbeafe' } }}>
                <FormatListBulleted fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit Details" arrow>
              <IconButton size="small" onClick={() => handleOpenEdit(params.row)} sx={{ backgroundColor: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', '&:hover': { backgroundColor: '#f1f5f9' } }}>
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
            
            {/* SD FEATURE: Archive/Hide Button imbes na Delete */}
            <Tooltip title={isArchived ? "Book is already hidden" : "Hide from Public"} arrow>
              <span>
                <IconButton 
                  size="small" 
                  disabled={isArchived}
                  onClick={() => setArchiveDialog({ open: true, id: params.row.id, title: params.row.title })} 
                  sx={{ backgroundColor: isArchived ? '#f1f5f9' : '#fef2f2', color: isArchived ? '#cbd5e1' : '#dc2626', '&:hover': { backgroundColor: isArchived ? '#f1f5f9' : '#fee2e2' } }}
                >
                  <VisibilityOff fontSize="small" />
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
        <Typography variant="h4" sx={{ fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em', mb: 0.5 }}>
          My Books
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b' }}>
          Manage your uploaded stories, add new chapters, and track their performance.
        </Typography>
      </Box>

      {/* Table Area */}
      <Paper elevation={0} sx={{ height: 650, width: '100%', borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
        <DataGrid
          rows={books}
          columns={columns}
          loading={showTableLoader}
          disableRowSelectionOnClick
          rowHeight={65} 
          // SD FEATURE: Limited to 10 Rows with Pagination
          initialState={{
            columns: {
              columnVisibilityModel: {
                created_at: false,
                rating: false,
                views_count: false
              }
            },
            pagination: { paginationModel: { pageSize: 10, page: 0 } }
          }}
          pageSizeOptions={[5, 10, 20]}
          slots={{
            toolbar: CustomToolbar,
            loadingOverlay: () => (
              <Box sx={{ p: 2 }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((item) => (
                  <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, borderBottom: '1px solid #f1f5f9', pb: 1.5 }}>
                    <Skeleton variant="rectangular" width={40} height={56} sx={{ borderRadius: 1 }} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="60%" height={24} />
                    </Box>
                    <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1.5 }} />
                    <Skeleton variant="text" width={80} height={24} />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Skeleton variant="circular" width={30} height={30} />
                      <Skeleton variant="circular" width={30} height={30} />
                    </Box>
                  </Box>
                ))}
              </Box>
            ),
            noRowsOverlay: () => (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                <LibraryBooks sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#64748b' }}>No books uploaded yet</Typography>
                <Typography variant="body2">Start your journey by uploading your first book.</Typography>
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

      {/* EDIT MODAL */}
      <Dialog open={editModalOpen} onClose={handleCloseEdit} maxWidth="sm" fullWidth scroll="paper">
        <DialogTitle sx={{ fontWeight: 'bold', color: '#0f172a', pb: 1, borderBottom: '1px solid #e2e8f0' }}>Edit Book Details</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <img src={editCoverPreview || 'https://via.placeholder.com/100x150?text=No+Cover'} alt="cover preview" style={{ width: 100, height: 150, objectFit: 'cover', borderRadius: 8, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#0f172a', mb: 1 }}>Book Cover</Typography>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 2 }}>Upload a new image if you want to change the current cover.</Typography>
                <input accept="image/*" style={{ display: 'none' }} id="edit-cover-upload" type="file" onChange={handleFileChange} />
                <label htmlFor="edit-cover-upload">
                  <Button variant="outlined" component="span" startIcon={<CloudUpload />} sx={{ textTransform: 'none', borderRadius: 2 }}>Change Cover</Button>
                </label>
              </Box>
            </Box>
            <TextField label="Book Title" fullWidth variant="outlined" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            <FormControl fullWidth>
              <InputLabel id="edit-genre-label">Genres</InputLabel>
              <Select labelId="edit-genre-label" multiple value={editSelectedGenres} onChange={handleGenreChange} input={<OutlinedInput label="Genres" />} renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => {
                    const genre = availableGenres.find(g => g.id === value);
                    return <Chip key={value} label={genre?.name || value} size="small" />;
                  })}
                </Box>
              )}>
                {availableGenres.map((genre) => (<MenuItem key={genre.id} value={genre.id}>{genre.name}</MenuItem>))}
              </Select>
            </FormControl>
            <TextField label="Synopsis / Description" fullWidth multiline rows={5} variant="outlined" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 2, borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={handleCloseEdit} sx={{ color: '#64748b', fontWeight: 'bold' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEdit} disabled={editLoading} sx={{ backgroundColor: '#2563eb', boxShadow: 'none', fontWeight: 'bold', minWidth: 120 }}>
            {editLoading ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* SD FEATURE: HIDE / ARCHIVE WARNING MODAL */}
      <Dialog open={!!archiveDialog} onClose={handleCloseArchiveDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold', color: '#dc2626' }}>
          <WarningAmber color="error" /> Hide Book?
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3, fontWeight: 'bold' }}>
            This will archive the book and remove it from public visibility for readers.
          </Alert>
          <Typography variant="body1" sx={{ color: '#334155', mb: 1 }}>
            This action cannot be undone from this dialog. To proceed, please type <strong>{archiveDialog?.title}</strong> to confirm.
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder={archiveDialog?.title}
            value={archiveConfirmationText}
            onChange={(e) => setArchiveConfirmationText(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseArchiveDialog} sx={{ color: '#64748b', fontWeight: 'bold' }}>Cancel</Button>
          <Button 
            variant="contained" 
            disabled={archiveConfirmationText !== archiveDialog?.title}
            onClick={handleArchiveBook}
            sx={{ backgroundColor: '#dc2626', boxShadow: 'none', fontWeight: 'bold', '&:hover': { backgroundColor: '#b91c1c' }, '&.Mui-disabled': { backgroundColor: '#fca5a5', color: '#fff' } }}
          >
            Yes, Hide It
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast({ ...toast, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setToast({ ...toast, open: false })} severity={toast.severity} sx={{ width: '100%', boxShadow: 3 }}>{toast.message}</Alert>
      </Snackbar>

    </Box>
  );
}
