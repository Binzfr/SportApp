import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import {
  Box,
  Flex,
  Heading,
  Button,
  Text,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  VStack,
  useToast
} from '@chakra-ui/react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

// Types
type Seance = {
  id: number;
  date: string;
  description: string;
  exercices: Exercise[];
};

type Exercise = {
  id: number;
  nom: string;
  series: number;
  repetitions: number;
  tempsRepos: number;
  videoUrl: string;
};

export default function Dashboard() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isSessionModalOpen, setSessionModalOpen] = useState(false);
  const [isExerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [sessionDesc, setSessionDesc] = useState('');
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [exerciseData, setExerciseData] = useState({ nom: '', series: 3, repetitions: 10, tempsRepos: 60 });

  // Fetch current user's séances
  const { data: seances = [], isLoading, isError, error } = useQuery<Seance[]>({
    queryKey: ['seancesMe'],
    queryFn: () => api.get<Seance[]>('/seances/me').then(res => res.data),
  });

  // Create a new session (backend will attach current user via JWT)
  const createSession = useMutation({
    mutationFn: () =>
      api.post<Seance>('/seances', {
        date: selectedDate.toISOString(),
        description: sessionDesc,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['seancesMe']);
      setSessionDesc('');
      setSessionModalOpen(false);
      toast({ status: 'success', title: 'Séance créée' });
    },
    onError: () => {
      toast({ status: 'error', title: 'Échec de la création' });
    }
  });

  // Update / delete session
  const updateSession = useMutation({
    mutationFn: (s: Seance) => api.put<Seance>(`/seances/${s.id}`, s),
    onSuccess: () => queryClient.invalidateQueries(['seancesMe']),
  });
  const deleteSession = useMutation({
    mutationFn: (id: number) => api.delete(`/seances/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['seancesMe']),
  });

  // Add / update / delete exercises
  const addExercise = useMutation({
    mutationFn: (data: Omit<Exercise, 'id'>) => api.post<Seance>(`/seances/${sessionId}/exercices`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['seancesMe']);
      setExerciseModalOpen(false);
      setExerciseData({ nom: '', series: 3, repetitions: 10, tempsRepos: 60 });
      toast({ status: 'success', title: 'Exercice ajouté' });
    },
  });
  const updateExercise = useMutation({
    mutationFn: ({ seanceId, exercice }: { seanceId: number; exercice: Exercise }) =>
      api.put<Exercise>(`/seances/${seanceId}/exercices/${exercice.id}`, exercice),
    onSuccess: () => queryClient.invalidateQueries(['seancesMe']),
  });
  const deleteExercise = useMutation({
    mutationFn: ({ seanceId, exerciceId }: { seanceId: number; exerciceId: number }) => api.delete(`/seances/${seanceId}/exercices/${exerciceId}`),
    onSuccess: () => queryClient.invalidateQueries(['seancesMe']),
  });

  if (isLoading) return <Text>Loading...</Text>;
  if (isError) return <Text>Error: {(error as Error).message}</Text>;

  return (
    <Flex p={6} height="100%">
      {/* Left Calendar */}
      <Box w="30%" p={4} borderRight="1px solid #ddd">
        <Heading size="md" mb={4}>Calendrier</Heading>
        <Calendar onChange={setSelectedDate} value={selectedDate} />
        <Button mt={4} colorScheme="blue" onClick={() => setSessionModalOpen(true)}>
          Créer séance
        </Button>
      </Box>

      {/* Right Sessions List */}
      <Box w="70%" p={4}>
        <Heading size="md" mb={4}>Séances existantes</Heading>
        <VStack align="stretch" spacing={3}>
          {seances.map(s => (
            <Box key={s.id} p={4} border="1px solid #ccc" borderRadius="md">
              <Flex justify="space-between" mb={2}>
                <Text fontWeight="bold">{new Date(s.date).toLocaleString()}</Text>
                <Flex>
                  <Button size="sm" mr={2} onClick={() => updateSession.mutate({ ...s, description: prompt('Nouvelle description', s.description) || s.description })}>
                    Editer
                  </Button>
                  <Button size="sm" colorScheme="red" onClick={() => deleteSession.mutate(s.id)}>
                    Supprimer
                  </Button>
                  <Button size="sm" ml={2} onClick={() => { setSessionId(s.id); setExerciseModalOpen(true); }}>
                    Ajouter Exo
                  </Button>
                </Flex>
              </Flex>
              <Text mb={2}>{s.description}</Text>
              <Box>
                {s.exercices.map(ex => (
                  <Flex key={ex.id} justify="space-between" p={2} borderTop="1px dashed #eee">
                    <Text>{ex.nom} - {ex.series}x{ex.repetitions} (repos {ex.tempsRepos}s)</Text>
                    <Flex>
                      <Button size="xs" mr={2} onClick={() => updateExercise.mutate({ seanceId: s.id, exercice: { ...ex, nom: prompt('Modifier nom', ex.nom) || ex.nom } })}>
                        ✏️
                      </Button>
                      <Button size="xs" colorScheme="red" onClick={() => deleteExercise.mutate({ seanceId: s.id, exerciceId: ex.id })}>
                        🗑️
                      </Button>
                    </Flex>
                  </Flex>
                ))}
              </Box>
            </Box>
          ))}
        </VStack>
      </Box>

      {/* Modal for Session */}
      <Modal isOpen={isSessionModalOpen} onClose={() => setSessionModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Nouvelle séance</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={3}>
              <Text>Date: {selectedDate.toLocaleString()}</Text>
              <Input placeholder="Description" value={sessionDesc} onChange={e => setSessionDesc(e.target.value)} />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setSessionModalOpen(false)} mr={3}>Annuler</Button>
            <Button colorScheme="blue" onClick={() => createSession.mutate()}>Créer</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal for Exercise */}
      <Modal isOpen={isExerciseModalOpen} onClose={() => setExerciseModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Nouvel exercice</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={3}>
              <Input placeholder="Nom" value={exerciseData.nom} onChange={e => setExerciseData({ ...exerciseData, nom: e.target.value })} />
              <Input type="number" placeholder="Séries" value={exerciseData.series} onChange={e => setExerciseData({ ...exerciseData, series: Number(e.target.value) })} />
              <Input type="number" placeholder="Répétitions" value={exerciseData.repetitions} onChange={e => setExerciseData({ ...exerciseData, repetitions: Number(e.target.value) })} />
              <Input type="number" placeholder="Repos (s)" value={exerciseData.tempsRepos} onChange={e => setExerciseData({ ...exerciseData, tempsRepos: Number(e.target.value) })} />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setExerciseModalOpen(false)} mr={3}>Annuler</Button>
            <Button colorScheme="blue" onClick={() => addExercise.mutate({ nom: exerciseData.nom, series: exerciseData.series, repetitions: exerciseData.repetitions, tempsRepos: exerciseData.tempsRepos })}>
              Ajouter
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
}
