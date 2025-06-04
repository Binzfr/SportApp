// src/pages/RegisterPage.tsx
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

type RegisterForm = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function RegisterPage() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>();
  const toast = useToast();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: (data: RegisterForm) =>
      api.post('/auth/register', {
        username: data.username,
        email: data.email,
        password: data.password,
      }),
    onSuccess: () => {
      toast({ status: 'success', title: "Inscription réussie !", description: "Vous pouvez maintenant vous connecter." });
      navigate('/login');
    },
    onError: () => {
      toast({ status: 'error', title: "Échec de l'inscriptions" });
    }
  });

  const onSubmit = (data: RegisterForm) => mutation.mutate(data);
  const password = watch('password', '');

  return (
    <Flex
      w="100vw"
      h="100vh"
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
        w="full"
        maxW="sm"
      >
        <Heading mb={6} textAlign="center" color="gray.800">
          S'inscrire
        </Heading>
        <form onSubmit={handleSubmit(onSubmit)}>
          <VStack spacing={6}>
            <FormControl isInvalid={!!errors.username}>
              <FormLabel>Nom d’utilisateur</FormLabel>
              <Input
                type="text"
                bg="rgba(255,255,255,0.3)"
                backdropFilter="blur(10px)"
                boxShadow="0 4px 16px rgba(0,0,0,0.1)"
                borderRadius="lg"
                {...register('username', { required: 'Requis' })}
              />
            </FormControl>
            <FormControl isInvalid={!!errors.email}>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                bg="rgba(255,255,255,0.3)"
                backdropFilter="blur(10px)"
                boxShadow="0 4px 16px rgba(0,0,0,0.1)"
                borderRadius="lg"
                {...register('email', {
                  required: 'Requis',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email invalide' }
                })}
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
                {...register('password', { required: 'Requis', minLength: { value: 6, message: '6 caractères min' } })}
              />
            </FormControl>
            <FormControl isInvalid={!!errors.confirmPassword}>
              <FormLabel>Confirmer le mot de passe</FormLabel>
              <Input
                type="password"
                bg="rgba(255,255,255,0.3)"
                backdropFilter="blur(10px)"
                boxShadow="0 4px 16px rgba(0,0,0,0.1)"
                borderRadius="lg"
                {...register('confirmPassword', {
                  required: 'Requis',
                  validate: value => value === password || 'Les mots de passe ne correspondent pas'
                })}
              />
            </FormControl>
            <Button
              type="submit"
              bg="rgba(255,255,255,0.3)"
              backdropFilter="blur(10px)"
              boxShadow="0 4px 16px rgba(0,0,0,0.1)"
              borderRadius="lg"
              w="full"
              size="lg"
              isLoading={mutation.isPending}
            >
              S'inscrire
            </Button>
            <Text fontSize="sm" color="gray.600">
              J'ai déjà un compte ?{' '}
              <ChakraLink as={RouterLink} to="/login" fontWeight="bold" color="pink.500">
                Connectez-vous
              </ChakraLink>
            </Text>
          </VStack>
        </form>
      </Box>
    </Flex>
  );
}
