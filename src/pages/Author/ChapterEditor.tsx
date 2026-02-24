import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, TextField, Button, Typography, Paper, 
  FormControlLabel, Switch, CircularProgress, Snackbar, Alert, Divider
} from '@mui/material';
import { Save as SaveIcon, ArrowBack, LockOutlined, LockOpenOutlined } from '@mui/icons-material';
import { supabase } from '../../lib/supabaseClient';

import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
  
export default function ChapterEditor() {
  const { bookId, chapterId } = useParams(); 
  const navigate = useNavigate();
  
  const isEditMode = !!chapterId; 

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true); 
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(''); // Ito ay magho-hold na ng HTML tags
  const [sequence, setSequence] = useState(1);
  const [isLocked, setIsLocked] = useState(false);
  
  const [toast, setToast] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  // Custom Toolbar Options para sa Authors
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }], // Pwedeng mag-Title, Subtitle
      ['bold', 'italic', 'underline', 'strike'], // Basic formatting
      [{ 'list': 'ordered'}, { 'list': 'bullet' }], // Numbering at Bullets
      [{ 'align': [] }], // Left, Center, Right, Justify
      ['clean'] // Button para tanggalin ang formatting
    ],
  };

  useEffect(() => {
    const fetchChapterData = async () => {
      if (!bookId) return;

      if (isEditMode) {
        const { data, error } = await supabase
          .from('chapters')
          .select('*')
          .eq('id', chapterId)
          .single();

        if (data && !error) {
          setTitle(data.title);
          setContent(data.content);
          setSequence(data.sequence_number);
          setIsLocked(data.is_locked);
        } else {
          showToast('Failed to load chapter details.', 'error');
        }
      } else {
        const { data } = await supabase
          .from('chapters')
          .select('sequence_number')
          .eq('book_id', bookId)
          .order('sequence_number', { ascending: false })
          .limit(1)
          .single();

        if (data) {
          setSequence(data.sequence_number + 1);
        }
      }
      setInitialLoading(false);
    };

    fetchChapterData();
  }, [bookId, chapterId, isEditMode]);

  const showToast = (message: string, severity: 'success' | 'error') => {
    setToast({ open: true, message, severity });
  };

  const handleSave = async () => {
    // Note: Sa Quill, kahit empty siya, minsan nag-iipon siya ng '<p><br></p>', kaya linisin natin konti ang checking
    const strippedContent = content.replace(/(<([^>]+)>)/gi, "").trim();

    if (!title.trim() || !strippedContent || !bookId) {
      showToast("Title and Content are required.", "error");
      return;
    }

    setLoading(true);
    try {
      if (isEditMode) {
        const { error } = await supabase
          .from('chapters')
          .update({
            title: title.trim(),
            content: content, // I-save natin kasama yung HTML formatting
            sequence_number: sequence,
            is_locked: isLocked
          })
          .eq('id', chapterId);

        if (error) throw error;
        showToast('Chapter updated successfully!', 'success');
      } else {
        const { error } = await supabase
          .from('chapters')
          .insert({
            book_id: bookId,
            title: title.trim(),
            content: content, // I-save natin kasama yung HTML formatting
            sequence_number: sequence,
            is_locked: isLocked
          });

        if (error) throw error;
        showToast('Chapter published successfully!', 'success');
      }
      
      setTimeout(() => navigate(`/author/books/${bookId}/chapters`), 1500);
      
    } catch (err: any) {
      showToast(err.message || "An error occurred.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '1200px', pb: 8 }}>
      
      <Button 
        startIcon={<ArrowBack />} 
        onClick={() => navigate(`/author/books/${bookId}/chapters`)} 
        sx={{ mb: 3, color: '#64748b', textTransform: 'none', fontWeight: 'bold', '&:hover': { backgroundColor: '#f1f5f9' } }}
      >
        Back to Chapters
      </Button>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: '900', color: '#0f172a', letterSpacing: '-0.02em', mb: 0.5 }}>
          {isEditMode ? 'Edit Chapter' : 'Write New Chapter'}
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b' }}>
          {isEditMode ? 'Make changes to your existing content below.' : 'Draft your story, set the sequence, and choose if it\'s a free or premium chapter.'}
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3 }}>
            <Box sx={{ width: { xs: '100%', sm: '120px' } }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#0f172a', mb: 1 }}>
                Chapter #
              </Typography>
              <TextField
                type="number"
                fullWidth
                value={sequence}
                onChange={(e) => setSequence(parseInt(e.target.value) || 1)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Box>
            
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#0f172a', mb: 1 }}>
                Chapter Title <span style={{ color: '#dc2626' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                required
                placeholder="e.g. The Beginning of the End"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>
          </Box>

          <Divider sx={{ borderColor: '#e2e8f0' }} />

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc', p: 2, borderRadius: 2, border: '1px solid #e2e8f0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                width: 40, height: 40, borderRadius: '50%', 
                backgroundColor: isLocked ? '#fee2e2' : '#dcfce7', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: isLocked ? '#dc2626' : '#16a34a'
              }}>
                {isLocked ? <LockOutlined /> : <LockOpenOutlined />}
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#0f172a' }}>
                  Premium Chapter
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  {isLocked ? "Only users with premium access or coins can read this chapter." : "This chapter is free for all users to read."}
                </Typography>
              </Box>
            </Box>
            <FormControlLabel
              control={
                <Switch 
                  checked={isLocked} 
                  onChange={(e) => setIsLocked(e.target.checked)} 
                  color="error"
                />
              }
              label={isLocked ? "Locked" : "Unlocked"}
              labelPlacement="start"
              sx={{ m: 0, '& .MuiFormControlLabel-label': { fontWeight: 'bold', color: '#475569', mr: 1, fontSize: '0.9rem' } }}
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#0f172a', mb: 1 }}>
              Story Content <span style={{ color: '#dc2626' }}>*</span>
            </Typography>
            
            {/* SENIOR DEV FIX: React Quill Wrapper para maging maganda ang itsura sa Material UI */}
            <Box 
              sx={{ 
                borderRadius: 2,
                overflow: 'hidden',
                border: '1px solid #cbd5e1',
                '& .ql-toolbar': {
                  backgroundColor: '#f8fafc',
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  borderBottom: '1px solid #cbd5e1',
                  borderTopLeftRadius: 8,
                  borderTopRightRadius: 8,
                  fontFamily: 'inherit',
                },
                '& .ql-container': {
                  backgroundColor: '#ffffff',
                  border: 'none',
                  minHeight: '400px', // Malaking space for writing
                  fontSize: '1.05rem',
                  fontFamily: 'Georgia, serif', // Book feel pa rin
                  lineHeight: 1.8,
                },
                '& .ql-editor': {
                  minHeight: '400px',
                  padding: '1.5rem',
                },
                '& .ql-editor.ql-blank::before': {
                  color: '#94a3b8',
                  fontStyle: 'normal',
                },
                // Hover effect na parang MUI TextField
                transition: 'border-color 0.2s',
                '&:hover': {
                  borderColor: '#94a3b8'
                }
              }}
            >
              <ReactQuill 
                theme="snow" 
                value={content} 
                onChange={setContent} 
                modules={quillModules}
                placeholder="Write your amazing story here..."
              />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2, borderTop: '1px solid #e2e8f0', mt: 1 }}>
            <Button 
              onClick={() => navigate(`/author/books/${bookId}/chapters`)} 
              sx={{ color: '#64748b', fontWeight: 'bold', px: 3 }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              size="large" 
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              onClick={handleSave}
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
              {isEditMode ? 'Save Changes' : 'Publish Chapter'}
            </Button>
          </Box>

        </Box>
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