// src/pages/LoginPage.tsx
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Heading,
  VStack,
  Text,
  useToast,
  Flex,
  Link as ChakraLink
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import api from '../api/client';

type LoginForm = { username: string; password: string };

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  const toast = useToast();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: (data: LoginForm) =>
      api.post('/auth/login', data),
    onSuccess: (res) => {
      localStorage.setItem('authToken', res.data.token);
      toast({ status: 'success', title: 'Connecté !' });
      navigate('/dashboard');
    },
    onError: () => {
      toast({ status: 'error', title: 'Échec de la connexion' });
    }
  });

  const onSubmit = (data: LoginForm) => mutation.mutate(data);

  return (
    <Flex
      width="100vw"
      height="100vh"
      align="center"
      justify="center"
      bg="gray.50"
    >
      <Box
        bg="rgba(255,255,255,0.2)"
        backdropFilter="blur(20px)"
        boxShadow="0 8px 32px rgba(0,0,0,0.1)"
        borderRadius="2xl"
        p={8}
        width="full"
        maxW="sm"
      >
        <Heading mb={6} textAlign="center" color="gray.800">
          Se connecter
        </Heading>
        <form onSubmit={handleSubmit(onSubmit)}>
          <VStack spacing={6}>
            <FormControl isInvalid={!!errors.username}>
              <FormLabel>Nom d’utilisateur</FormLabel>
              <Input
                bg="rgba(255,255,255,0.3)"
                backdropFilter="blur(10px)"
                boxShadow="0 4px 16px rgba(0,0,0,0.1)"
                borderRadius="lg"
                {...register('username', { required: 'Requis' })}
              />
            </FormControl>
            <FormControl isInvalid={!!errors.password}>
              <FormLabel>Mot de passe</FormLabel>
              <Input
                type="password"
                bg="rgba(255,255,255,0.3)"
                backdropFilter="blur(10px)"
                boxShadow="0 4px 16px rgba(0,0,0,0.1)"
                borderRadius="lg"
                {...register('password', { required: 'Requis' })}
              />
            </FormControl>
            <Button
              type="submit"
                bg="rgba(255,255,255,0.3)"
                backdropFilter="blur(10px)"
                boxShadow="0 4px 16px rgba(0,0,0,0.1)"
                borderRadius="lg"
                width="full"
                size="lg"
                isLoading={mutation.isPending}
            >
              Connexion
            </Button>
            <Text fontSize="sm" color="gray.600">
              Je n'ai pas de compte ?{' '}
              <ChakraLink as={RouterLink} to="/register" fontWeight="bold" color="pink.500">
                Créez-en un
              </ChakraLink>
            </Text>
          </VStack>
        </form>
      </Box>
    </Flex>
  );
}
