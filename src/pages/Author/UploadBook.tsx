import { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Paper, MenuItem, CircularProgress, 
  FormControl, Select, OutlinedInput, Chip, Snackbar, Alert, IconButton} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { CloudUpload as UploadIcon, Close as CloseIcon, Image as ImageIcon } from '@mui/icons-material';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Genre {
  id: string;
  name: string;
}

export default function UploadBook() {
  const { session } = useAuth(); 
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // Image & Preview State
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Genre State
  const [availableGenres, setAvailableGenres] = useState<Genre[]>([]);
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchGenres = async () => {
      const { data, error } = await supabase
        .from('genres')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching genres:', error.message);
      } else if (data) {
        setAvailableGenres(data);
      }
    };

    fetchGenres();
  }, []);

  const showToast = (message: string, severity: 'success' | 'error') => {
    setToast({ open: true, message, severity });
  };

  // --- DRAG AND DROP HANDLERS ---
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setCoverFile(file);
        setCoverPreview(URL.createObjectURL(file));
      } else {
        showToast('Please upload a valid image file (JPG, PNG).', 'error');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file)); 
    }
  };

  const handleRemoveImage = () => {
    setCoverFile(null);
    setCoverPreview(null);
  };

  const handleGenreChange = (event: SelectChangeEvent<typeof selectedGenreIds>) => {
    const { target: { value } } = event;
    setSelectedGenreIds(typeof value === 'string' ? value.split(',') : value);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    if (!coverFile) {
      showToast("Please upload a book cover.", "error");
      return;
    }
    if (selectedGenreIds.length === 0) {
      showToast("Please select at least one genre.", "error");
      return;
    }

    setLoading(true);

    try {
      const fileExt = coverFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('covers') 
        .upload(filePath, coverFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('covers')
        .getPublicUrl(filePath);

      const { data: newBook, error: dbError } = await supabase
        .from('books')
        .insert({
          title: title.trim(),
          description: description.trim(),
          cover_url: publicUrl,
          author_id: session.user.id,
          status: 'pending_review',
          price: 0,
        })
        .select('id')
        .single();

      if (dbError) throw dbError;

      if (newBook && selectedGenreIds.length > 0) {
        const bookGenresData = selectedGenreIds.map((genreId) => ({
          book_id: newBook.id,
          genre_id: genreId,
        }));

        const { error: genreError } = await supabase
          .from('book_genres')
          .insert(bookGenresData);

        if (genreError) throw genreError;
      }

      showToast('Book submitted successfully for review!', 'success');
      setTimeout(() => navigate('/author/books'), 1500);

    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Something went wrong.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    // SENIOR DEV FIX: Tinanggal ang 'mx: auto' at ginawang 1200px ang maxWidth para pumantay sa left side
    <Box sx={{ maxWidth: '1200px', pb: 8 }}>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em', mb: 0.5 }}>
          Upload New Book
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b' }}>
          Publish your new story to the GenrA platform. Fill in the details below.
        </Typography>
      </Box>

      <Paper 
        elevation={0} 
        sx={{ 
          p: { xs: 3, md: 5 }, 
          borderRadius: 4, 
          border: '1px solid #e2e8f0', 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          backgroundColor: '#ffffff'
        }}
      >
        <form onSubmit={handleUpload}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 4, md: 6 } }}>
            
            {/* LEFT COLUMN: Image Upload Area */}
            <Box sx={{ width: { xs: '100%', md: '300px' }, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#0f172a' }}>
                Book Cover <span style={{ color: '#dc2626' }}>*</span>
              </Typography>

              <Box 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                sx={{ 
                  width: '100%', 
                  height: 400, 
                  borderRadius: 3, 
                  border: coverPreview ? 'none' : '2px dashed',
                  borderColor: isDragging ? '#2563eb' : '#cbd5e1',
                  backgroundColor: coverPreview ? 'transparent' : (isDragging ? '#eff6ff' : '#f8fafc'),
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer', 
                  '&:hover': { borderColor: coverPreview ? 'none' : '#94a3b8', backgroundColor: coverPreview ? 'transparent' : '#f1f5f9' }
                }}
              >
                {coverPreview ? (
                  <>
                    <img src={coverPreview} alt="Cover Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <IconButton 
                      onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
                      sx={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(255,255,255,0.8)', '&:hover': { backgroundColor: 'white' } }}
                      size="small"
                    >
                      <CloseIcon fontSize="small" color="error" />
                    </IconButton>
                  </>
                ) : (
                  <>
                    <ImageIcon sx={{ fontSize: 48, color: isDragging ? '#2563eb' : '#94a3b8', mb: 2 }} />
                    <Typography variant="body2" sx={{ color: isDragging ? '#2563eb' : '#64748b', mb: 2, textAlign: 'center', px: 2, fontWeight: isDragging ? 'bold' : 'normal' }}>
                      {isDragging ? "Drop image here!" : "Drag and drop your cover here, or click to browse."}
                    </Typography>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="cover-upload-input"
                      type="file"
                      onChange={handleFileChange}
                    />
                    <label htmlFor="cover-upload-input" style={{ width: '100%', textAlign: 'center' }}>
                      <Button variant="outlined" component="span" startIcon={<UploadIcon />} sx={{ textTransform: 'none', borderRadius: 2, borderColor: '#cbd5e1', color: '#475569', pointerEvents: 'none' }}>
                        Browse Files
                      </Button>
                    </label>
                  </>
                )}
              </Box>
              <Typography variant="caption" sx={{ color: '#94a3b8', textAlign: 'center' }}>
                Recommended: 600x900px (JPG, PNG). Max 2MB.
              </Typography>
            </Box>

            {/* RIGHT COLUMN: Form Fields */}
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
              
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#0f172a', mb: 1 }}>
                  Title <span style={{ color: '#dc2626' }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  required
                  variant="outlined"
                  placeholder="Enter the title of your book"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#0f172a', mb: 1 }}>
                  Genres <span style={{ color: '#dc2626' }}>*</span>
                </Typography>
                <FormControl fullWidth required>
                  <Select
                    multiple
                    displayEmpty
                    value={selectedGenreIds}
                    onChange={handleGenreChange}
                    input={<OutlinedInput sx={{ borderRadius: 2 }} />}
                    renderValue={(selected) => {
                      if (selected.length === 0) {
                        return <Typography sx={{ color: '#94a3b8' }}>Select up to 3 genres</Typography>;
                      }
                      return (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => {
                            const genre = availableGenres.find(g => g.id === value);
                            return <Chip key={value} label={genre?.name || value} size="small" sx={{ backgroundColor: '#f1f5f9', fontWeight: 500 }} />;
                          })}
                        </Box>
                      );
                    }}
                  >
                    {availableGenres.length === 0 ? (
                      <MenuItem disabled>Loading genres...</MenuItem>
                    ) : (
                      availableGenres.map((genre) => (
                        <MenuItem key={genre.id} value={genre.id}>
                          {genre.name}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#0f172a', mb: 1 }}>
                  Synopsis / Description <span style={{ color: '#dc2626' }}>*</span>
                </Typography>
                <TextField
                  multiline
                  rows={8}
                  fullWidth
                  required
                  variant="outlined"
                  placeholder="Write a compelling synopsis to hook your readers..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2, pt: 3, borderTop: '1px solid #e2e8f0' }}>
                <Button 
                  onClick={() => navigate('/author/books')} 
                  sx={{ color: '#64748b', fontWeight: 'bold', px: 3 }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{ 
                    backgroundColor: '#2563eb', 
                    boxShadow: 'none', 
                    fontWeight: 'bold', 
                    px: 4, 
                    borderRadius: 2,
                    minWidth: 160
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Submit for Review'}
                </Button>
              </Box>

            </Box>
          </Box>
        </form>
      </Paper>

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