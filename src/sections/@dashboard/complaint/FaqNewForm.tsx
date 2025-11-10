import * as Yup from 'yup';
// next
import { useRouter } from 'next/router';
// form
import { useForm } from 'react-hook-form';

import { yupResolver } from '@hookform/resolvers/yup';
// @mui
import { LoadingButton } from '@mui/lab';
import { Box, Card, Grid, Stack } from '@mui/material';
// components
import { useSnackbar } from '../../../components/snackbar';
import axios from '../../../utils/axios';

// routes
import { PATH_DASHBOARD } from '../../../routes/paths';

import FormProvider, { 
  RHFTextField,
} from '../../../components/hook-form';

// ----------------------------------------------------------------------

interface FormValuesProps {
  title: string;
  content: string;
}

type Props = {
  isEdit?: boolean;
};

export default function FaqNewForm({ isEdit = false }: Props) {
  const { push } = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const NewUserSchema = Yup.object().shape({
    title: Yup.string().required('FAQ title is required'),
    content: Yup.string().required('FAQ content is required')
  });
 
  const methods = useForm<FormValuesProps>({
    resolver: yupResolver(NewUserSchema),
    defaultValues: {
      title:  '',
      content:  '',
    },
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;
 

  const onSubmit = async (formState: FormValuesProps) => {
    
    try { 
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const response = await axios.post('/admin/faqs', {
        ...formState, 
      });

      console.log(response.data);
      enqueueSnackbar(response.data.message || 'Operation successful!');
      
      reset(); 
      push(PATH_DASHBOARD.faq.list);

    } catch (error) {
      console.error(error);
      enqueueSnackbar('An error occurred during submission.', { variant: 'error' });
    }
  }; 

  return (
    <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={12}>
          <Card sx={{ p: 3 }}>
            <Box
              rowGap={3}
              columnGap={1}
              display="grid"
              // 👇 MODIFICATION: Set gridTemplateColumns to repeat(1, 1fr) for all sizes (xs, sm)
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)', // 1 column on extra small screens
                sm: 'repeat(1, 1fr)', // 1 column on small/medium screens
              }}
            >
              <RHFTextField name="title" label="Title" />
              <RHFTextField name="content" label="Content" />
            </Box>
            

            <Stack alignItems="flex-end" sx={{ mt: 3 }}>
              <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                {!isEdit ? 'Create FAQ' : 'Save Changes'}
              </LoadingButton>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </FormProvider>
  );
}