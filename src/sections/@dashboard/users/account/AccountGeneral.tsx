import * as Yup from 'yup';
import { useCallback, useEffect, useState } from 'react';

// form
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
// @mui
import { Box, Grid, Card, Stack, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
// auth
import { useAuthContext } from '../../../../auth/useAuthContext';
// utils
import { fData } from '../../../../utils/formatNumber';
// assets
import axios from '../../../../utils/axios';

// components
import { CustomFile } from '../../../../components/upload';
import { useSnackbar } from '../../../../components/snackbar';
import FormProvider, {
  RHFSwitch,
  RHFTextField,
  RHFUploadAvatar,
} from '../../../../components/hook-form';

// ----------------------------------------------------------------------

type FormValuesProps = {
  first_name: string;
  last_name: string;
  email: string;
  photoURL: CustomFile | string | null;
  phoneNumber: string | null;
  country: string | null;
  address: string | null;
  state: string | null;
  city: string | null;
  zipCode: string | null;
  about: string | null;
  isPublic: boolean;
};

export default function AccountGeneral() {
  const { enqueueSnackbar } = useSnackbar();

  const { user } = useAuthContext();  
  const urlPath = window.location.pathname;
  const id = urlPath.split('/').filter(Boolean).pop(); 
  const [responseData, setResponseData] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const config = {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }; 
        const response = await axios.get(`/admin/user/details/${id}`, config);
        setResponseData(response.data.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchDashboardData();
  }, [id]);
  
  const UpdateUserSchema = Yup.object().shape({
    first_name: Yup.string().required('First name is required'),
    last_name: Yup.string().required('Last name is required'),
  });

  const defaultValues = {
    first_name: responseData?.first_name || '',
    last_name: responseData?.last_name || '',
    email: responseData?.email || '',
    photoURL: user?.photoURL || null,
    phoneNumber: responseData?.phone || '',
    country: user?.country || '',
    address: user?.address || '',
    state: user?.state || '',
    city: user?.city || '',
    zipCode: user?.zipCode || '',
    about: user?.about || '',
    isPublic: user?.isPublic || false,
  };

  const methods = useForm<FormValuesProps>({
    resolver: yupResolver(UpdateUserSchema),
    defaultValues,
  });

  const {
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = async (data: FormValuesProps) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      enqueueSnackbar('Update success!');
      console.log('DATA', data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];

      const newFile = Object.assign(file, {
        preview: URL.createObjectURL(file),
      });

      if (file) {
        setValue('photoURL', newFile, { shouldValidate: true });
      }
    },
    [setValue]
  );

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ py: 10, px: 3, textAlign: 'center' }}>
            <RHFUploadAvatar
              name="photoURL"
              maxSize={3145728}
              onDrop={handleDrop}
              helperText={
                <Typography
                  variant="caption"
                  sx={{
                    mt: 2,
                    mx: 'auto',
                    display: 'block',
                    textAlign: 'center',
                    color: 'text.secondary',
                  }}
                >
                  Allowed *.jpeg, *.jpg, *.png, *.gif
                  <br /> max size of {fData(3145728)}
                </Typography>
              }
            />

            <RHFSwitch
              name="isPublic"
              labelPlacement="start"
              label="Public Profile"
              sx={{ mt: 5 }}
            />
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
              }}
            >
              <RHFTextField name="first_name" focused value={responseData?.first_name} label="First Name" />

              <RHFTextField name="last_name" focused value={responseData?.last_name} label="Last Name" />

              <RHFTextField name="email" focused  value={responseData?.email} label="Email Address" />

              <RHFTextField name="phone" focused  value={responseData?.phone} label="Phone Number" />

              <RHFTextField name="gender" focused  value={responseData?.gender}  label="Gender" />
              <RHFTextField name="nationality" focused  value={responseData?.bvn}  label="Nationality" />
              <RHFTextField name="bvn" focused  value={responseData?.bvn}  label="BVN" />
              <RHFTextField name="xpressCustomerId" focused  value={responseData?.xpressCustomerId}  label="Xpress Customer Id" />
              <RHFTextField name="xpressWalletId" focused  value={responseData?.xpressWalletId}  label="Xpress Wallet Id" />
 
            </Box>

            <Stack spacing={3} alignItems="flex-end" sx={{ mt: 3 }}>
              { /* <RHFTextField name="about" multiline rows={4} label="About" /> */ }
              <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                Save Changes
              </LoadingButton>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </FormProvider>
  );
}