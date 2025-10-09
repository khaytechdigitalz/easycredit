import { useRouter } from 'next/router';
// @mui
import { Stack, Button, Typography, Box } from '@mui/material';
// auth
import { useAuthContext } from '../../../auth/useAuthContext';
import { PATH_AUTH } from '../../../routes/paths';

// locales
import { useLocales } from '../../../locales';
import { useSnackbar } from '../../../components/snackbar';

// ----------------------------------------------------------------------

export default function NavDocs() {
  const { replace } = useRouter();

  const handleClosePopover = () => {
  };
  const { enqueueSnackbar } = useSnackbar();

  const { logout } = useAuthContext();
  const handleLogout = async () => {
    try {
      logout();
      replace(PATH_AUTH.login);
      handleClosePopover();
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Unable to logout!', { variant: 'error' });
    }
  };
  const { translate } = useLocales();

  return (
    <Stack
      spacing={3}
      sx={{
        px: 5,
        pb: 5,
        mt: 10,
        width: 1,
        display: 'block',
        textAlign: 'center',
      }}
    >
      <Box component="img" src="/assets/illustrations/illustration_docs.svg" />

      <div>
        <Typography gutterBottom variant="subtitle1">
          {`${translate('docs.hi')}, Admin`}
        </Typography>

        <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'pre-line' }}>
          {`${translate('docs.description')}`}
        </Typography>
      </div>

      <Button href='#' onClick={handleLogout}  target="_blank" rel="noopener" variant="contained">
       Logout Now
      </Button>
    </Stack>
  );
}
