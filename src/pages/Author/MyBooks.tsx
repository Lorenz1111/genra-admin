import { useEffect, useState } from 'react';
import { 
  Box, Typography, Paper, Button, IconButton, Tooltip, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
  Snackbar, Alert, CircularProgress, FormControl, InputLabel, Select, MenuItem, OutlinedInput 
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { DataGrid, GridToolbarContainer } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { AddCircleOutline, Edit, FormatListBulleted, LibraryBooks, CloudUpload } from '@mui/icons-material';
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

  const [toast, setToast] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const fetchData = async () => {
      if (!session) return;

      const { data: booksData, error: booksError } = await supabase
        .from('books')
        .select(`
          *,
          book_genres (
            genre_id,
            genres ( id, name )
          ),
          chapters ( id )
        `)
        .eq('author_id', session.user.id)
        .order('created_at', { ascending: false });

      if (booksError) console.error('Error fetching books:', booksError);
      else setBooks(booksData as any || []);

      const { data: genresData } = await supabase
        .from('genres')
        .select('id, name')
        .order('name', { ascending: true });
        
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
    if (!editBookId) {
      showToast('Book ID is missing.', 'error');
      return;
    }

    setEditLoading(true);
    
    try {
      let finalCoverUrl = editCoverPreview;

      if (editCoverFile && session) {
        const fileExt = editCoverFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${session.user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('covers') 
          .upload(filePath, editCoverFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('covers')
          .getPublicUrl(filePath);
          
        finalCoverUrl = publicUrl;
      }

      const { error: updateError } = await supabase
        .from('books')
        .update({ 
          title: editTitle.trim(), 
          description: editDescription.trim(),
          cover_url: finalCoverUrl
        })
        .eq('id', editBookId as string);

      if (updateError) throw updateError;

      await supabase.from('book_genres').delete().eq('book_id', editBookId as string);
      
      const genreInserts = editSelectedGenres.map(genreId => ({
        book_id: editBookId as string,
        genre_id: genreId
      }));
      
      const { error: genreError } = await supabase.from('book_genres').insert(genreInserts);
      if (genreError) throw genreError;

      const newBookGenresObj = editSelectedGenres.map(genreId => {
        const genreDetail = availableGenres.find(g => g.id === genreId);
        return {
          genre_id: genreId,
          genres: { id: genreId, name: genreDetail?.name || 'Unknown' }
        };
      });

      setBooks(prevBooks => prevBooks.map(book => {
        if (book.id === editBookId) {
          return {
            ...book,
            title: editTitle.trim(),
            description: editDescription.trim(),
            cover_url: finalCoverUrl,
            book_genres: newBookGenresObj as any
          };
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
      width: 90,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <img 
            src={params.value as string || 'https://via.placeholder.com/50'} 
            alt="cover" 
            style={{ width: 44, height: 64, objectFit: 'cover', borderRadius: 6, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
          />
        </Box>
      )
    },
    { 
      field: 'title', 
      headerName: 'Title & Status', 
      flex: 1, 
      minWidth: 220,
      renderCell: (params: GridRenderCellParams) => {
        const status = (params.row.status as string | null) || 'unknown';
        let statusColor = '#64748b';
        if (status === 'approved') statusColor = '#16a34a';
        else if (status === 'rejected') statusColor = '#dc2626';
        else if (status === 'pending_review') statusColor = '#ea580c';

        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', gap: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.2, whiteSpace: 'normal', wordWrap: 'break-word' }}>
              {params.value}
            </Typography>
            <Typography variant="caption" sx={{ color: statusColor, fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 0.5 }}>
              {status.replace('_', ' ')}
            </Typography>
          </Box>
        );
      }
    },
    { 
      field: 'genre', 
      headerName: 'Genres', 
      width: 200,
      renderCell: (params: GridRenderCellParams) => {
        const genres = (params.row.book_genres?.map((bg: any) => bg.genres?.name).filter(Boolean) as string[]) || [];
        
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5, height: '100%' }}>
            {genres.length > 0 ? (
              genres.map((genre: string, index: number) => (
                <Chip 
                  key={index} 
                  label={genre} 
                  size="small" 
                  sx={{ backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 600, fontSize: '0.7rem', borderRadius: 1.5 }} 
                />
              ))
            ) : (
              <Typography variant="body2" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>No genre</Typography>
            )}
          </Box>
        );
      }
    },
    { 
      field: 'chapters_count', 
      headerName: 'Chapters', 
      width: 100, 
      type: 'number',
      renderCell: (params: GridRenderCellParams) => {
        const count = params.row.chapters?.length || 0;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
              {count}
            </Typography>
          </Box>
        )
      }
    },
    { 
      field: 'views_count', 
      headerName: 'Views', 
      width: 100, 
      type: 'number',
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
            {(params.value as number | null)?.toLocaleString() || 0}
          </Typography>
        </Box>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 140,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: '100%' }}>
          <Tooltip title="Manage Chapters" arrow>
            <IconButton 
              size="small"
              onClick={() => navigate(`/author/books/${params.row.id}/chapters`)}
              sx={{ backgroundColor: '#eff6ff', color: '#2563eb', '&:hover': { backgroundColor: '#dbeafe' } }}
            >
              <FormatListBulleted fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Details" arrow>
            <IconButton 
              size="small"
              onClick={() => handleOpenEdit(params.row)}
              sx={{ backgroundColor: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', '&:hover': { backgroundColor: '#f1f5f9' } }}
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ maxWidth: '1200px', pb: 8 }}>
      
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em', mb: 0.5 }}>
          My Books
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b' }}>
          Manage your uploaded stories, add new chapters, and track their performance.
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
          rowHeight={80} 
          slots={{
            toolbar: CustomToolbar,
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
            '& .MuiDataGrid-cell': { borderColor: '#f1f5f9' }
          }}
        />
      </Paper>

      {/* ======================================================= */}
      {/* EDIT BOOK MODAL                                         */}
      {/* ======================================================= */}
      <Dialog open={editModalOpen} onClose={handleCloseEdit} maxWidth="sm" fullWidth scroll="paper">
        <DialogTitle sx={{ fontWeight: 'bold', color: '#0f172a', pb: 1, borderBottom: '1px solid #e2e8f0' }}>
          Edit Book Details
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            
            {/* Image Preview & Upload */}
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <img 
                src={editCoverPreview || 'https://via.placeholder.com/100x150?text=No+Cover'} 
                alt="cover preview" 
                style={{ width: 100, height: 150, objectFit: 'cover', borderRadius: 8, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
              />
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#0f172a', mb: 1 }}>Book Cover</Typography>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 2 }}>Upload a new image if you want to change the current cover.</Typography>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="edit-cover-upload"
                  type="file"
                  onChange={handleFileChange}
                />
                <label htmlFor="edit-cover-upload">
                  <Button variant="outlined" component="span" startIcon={<CloudUpload />} sx={{ textTransform: 'none', borderRadius: 2 }}>
                    Change Cover
                  </Button>
                </label>
              </Box>
            </Box>

            <TextField
              label="Book Title"
              fullWidth
              variant="outlined"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
            
            <FormControl fullWidth>
              <InputLabel id="edit-genre-label">Genres</InputLabel>
              <Select
                labelId="edit-genre-label"
                multiple
                value={editSelectedGenres}
                onChange={handleGenreChange}
                input={<OutlinedInput label="Genres" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const genre = availableGenres.find(g => g.id === value);
                      return <Chip key={value} label={genre?.name || value} size="small" />;
                    })}
                  </Box>
                )}
              >
                {availableGenres.map((genre) => (
                  <MenuItem key={genre.id} value={genre.id}>
                    {genre.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Synopsis / Description"
              fullWidth
              multiline
              rows={5}
              variant="outlined"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 2, borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={handleCloseEdit} sx={{ color: '#64748b', fontWeight: 'bold' }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveEdit}
            disabled={editLoading}
            sx={{ backgroundColor: '#2563eb', boxShadow: 'none', fontWeight: 'bold', minWidth: 120 }}
          >
            {editLoading ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast Notification */}
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