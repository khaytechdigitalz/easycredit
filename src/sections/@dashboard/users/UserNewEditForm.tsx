import * as Yup from 'yup';
// next
import { useRouter } from 'next/router';
// form
import { useForm } from 'react-hook-form';

import { yupResolver } from '@hookform/resolvers/yup';
// @mui
import { LoadingButton } from '@mui/lab';
import { Box, Card, Grid, Stack } from '@mui/material'; // Removed unused imports
// @types
import { IUserAccountGeneral } from '../../../@types/user';
// components
// Removed unused imports: Label, CustomFile, FormControlLabel, Switch, Typography, Controller
import { useSnackbar } from '../../../components/snackbar';
import axios from '../../../utils/axios';

// routes
import { PATH_DASHBOARD } from '../../../routes/paths';

import FormProvider, { 
  RHFTextField,
} from '../../../components/hook-form';

// ----------------------------------------------------------------------

// Interface for form values, matching the shape of your form fields
interface FormValuesProps {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  bankone_customerid: string;
  // You would typically include other fields here, 
  // but since you only use these in the form, we keep it simple.
  // avatarUrl: CustomFile | string | null; // Removed as it's not used in the form
}

type Props = {
  isEdit?: boolean;
  currentUser?: IUserAccountGeneral;
};

export default function UserNewEditForm({ isEdit = false, currentUser }: Props) {
  const { push } = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  // Define the Yup Schema using the correct FormValuesProps type
  const NewUserSchema = Yup.object().shape({
    first_name: Yup.string().required('First Name is required'),
    last_name: Yup.string().required('Last Name is required'),
    email: Yup.string().required('Email is required').email('Email must be a valid email address'),
    phone: Yup.string().required('Phone number is required'),
    bankone_customerid: Yup.string().required('Bank One is required'),
  });
 
  // 1. Correctly initialized useForm with the type
  const methods = useForm<FormValuesProps>({
    resolver: yupResolver(NewUserSchema),
    // Optional: set default values based on currentUser if it exists
    defaultValues: {
      first_name:  '',
      last_name: '',
      email: '',
      phone: '',
      bankone_customerid: '',
    },
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;
 

  // 2. Correctly type the formState parameter
  const onSubmit = async (formState: FormValuesProps) => {
    
    try { 
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      // --- LOGIC CORRECTION ---
      // When using react-hook-form with RHFTextFields, all data you need is in 'formState'.
      // Creating a new FormData object from the DOM form is redundant and error-prone for plain text fields.
      // Send the 'formState' object directly as JSON, which is standard practice.
      
      const response = await axios.post('/admin/user/create', {
        // Send the entire formState object (the validated form data)
        ...formState, 
        // Note: axios sends this as application/json by default.
      });

      console.log(response.data);
      enqueueSnackbar(response.data.message || 'Operation successful!');
      
      // Optional: Clear form or redirect
      reset(); 
      push(PATH_DASHBOARD.client.list);

    } catch (error) {
      console.error(error);
      enqueueSnackbar('An error occurred during submission.', { variant: 'error' });
    }
  }; // 3. Removed extra closing brace here

  return (
    // Removed 'enctype="multipart/form-data"' as you are now sending JSON
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={12}>
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
              <RHFTextField name="first_name" label="First Name" />
              <RHFTextField name="last_name" label="Last Name" />
              <RHFTextField name="email" label="Email Address" />
              <RHFTextField name="phone" label="Phone Number" />
              <RHFTextField name="bankone_customerid" label="BankOne ID" />
            </Box>
            

            <Stack alignItems="flex-end" sx={{ mt: 3 }}>
              <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                {!isEdit ? 'Create User' : 'Save Changes'}
              </LoadingButton>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </FormProvider>
  );
}