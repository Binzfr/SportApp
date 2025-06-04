import { useState } from 'react';
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
import 'react-calendar/dist/Calendar.css';

// Types
type Seance = {
  id: number;
  date: string;
  description: string;
  exercices: Exercise[];
  frequencyDay?: string;
  frequencyMonths?: number;
};

type Exercise = {
  id: number;
  nom: string;
  series: number;
  repetitions: number;
  tempsRepos: number;
  videoUrl: string;
};

// Helper pour décoder le JWT
function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

function canCreate(type: 'session' | 'exercise') {
  const key = type === 'session' ? 'sessionTimestamps' : 'exerciseTimestamps';
  const limit = type === 'session' ? 5 : 20;
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const timestamps = JSON.parse(localStorage.getItem(key) || '[]').filter((t: number) => t > oneHourAgo);
  if (timestamps.length >= limit) {
    const nextAllowed = new Date(Math.min(...timestamps) + 60 * 60 * 1000);
    return { allowed: false, wait: Math.ceil((nextAllowed.getTime() - now) / 60000) };
  }
  // Ajoute le timestamp courant
  timestamps.push(now);
  localStorage.setItem(key, JSON.stringify(timestamps));
  return { allowed: true };
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [isSessionModalOpen, setSessionModalOpen] = useState(false);
  const [isExerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [sessionDesc, setSessionDesc] = useState('');
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [exerciseData, setExerciseData] = useState({ nom: '', series: 3, repetitions: 10, tempsRepos: 60, videoUrl: '' });
  const [sessionFrequencyDay, setSessionFrequencyDay] = useState<string>('Friday');
  const [sessionFrequencyMonths, setSessionFrequencyMonths] = useState<number>(1);
  const [editSession, setEditSession] = useState<Seance | null>(null);
  const [editExercise, setEditExercise] = useState<{ ex: Exercise; seanceId: number } | null>(null);

  // Fetch current user's séances
  const { data: seances = [], isLoading, isError, error } = useQuery<Seance[]>({
    queryKey: ['seancesMe'],
    queryFn: () => api.get<Seance[]>('/seances/me').then(res => res.data),
  });

  // Récupère le username depuis le JWT
  const token = localStorage.getItem('authToken');
  const userPayload = token ? parseJwt(token) : null;
  const userId = userPayload?.id;
  const username = userPayload?.sub || 'Utilisateur';

  // Create a new session (envoie la fréquence, plus besoin de générer les dates)
  const createSession = useMutation({
    mutationFn: () => {
      const check = canCreate('session');
      if (!check.allowed) {
        toast({ status: 'error', title: `Veuillez attendre ${check.wait} min avant de créer une nouvelle séance.` });
        throw new Error('Rate limited');
      }
      return api.post(`/seances?userId=${userId}`, {
        description: sessionDesc,
        frequencyDay: sessionFrequencyDay,
        frequencyMonths: sessionFrequencyMonths,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seancesMe'] });
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
    onSuccess: () => queryClient.invalidateQueries({queryKey:['seancesMe']}),
  });
  const deleteSession = useMutation({
    mutationFn: (id: number) => api.delete(`/seances/${id}`),
    onSuccess: () => queryClient.invalidateQueries({queryKey:['seancesMe']}),
  });

  // Add / update / delete exercises
  const addExercise = useMutation({
    mutationFn: (data: Omit<Exercise, 'id'>) => api.post<Seance>(`/seances/${sessionId}/exercices`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey:['seancesMe']});
      setExerciseModalOpen(false);
      setExerciseData({ nom: '', series: 3, repetitions: 10, tempsRepos: 60, videoUrl: '' });
      toast({ status: 'success', title: 'Exercice ajouté' });
    },
  });
  const updateExercise = useMutation({
    mutationFn: ({ seanceId, exercice }: { seanceId: number; exercice: Exercise }) =>
      api.put<Exercise>(`/seances/${seanceId}/exercices/${exercice.id}`, exercice),
    onSuccess: () => queryClient.invalidateQueries({queryKey:['seancesMe']}),
  });
  const deleteExercise = useMutation({
    mutationFn: ({ seanceId, exerciceId }: { seanceId: number; exerciceId: number }) => api.delete(`/seances/${seanceId}/exercices/${exerciceId}`),
    onSuccess: () => queryClient.invalidateQueries({queryKey:['seancesMe']}),
  });

  if (isLoading) return <Text>Loading...</Text>;
  if (isError) return <Text>Error: {(error as Error).message}</Text>;

  // Utilitaire pour afficher le jour en français au pluriel
  const getJourPluriel = (day: string) => {
    switch (day) {
      case 'Monday': return 'lundis';
      case 'Tuesday': return 'mardis';
      case 'Wednesday': return 'mercredis';
      case 'Thursday': return 'jeudis';
      case 'Friday': return 'vendredis';
      case 'Saturday': return 'samedis';
      case 'Sunday': return 'dimanches';
      default: return day;
    }
  };

  return (
    <Flex direction="column" align="center" p={[2, 4]} minH="100vh" bg="gray.50">
      <Box maxW="600px" w="100%" mb={6}>
        <Text fontSize={["md", "xl"]} fontWeight="bold" mb={2}>
          Bonjour {username}, bienvenue dans la démo de mon application pour créer des séances de sport.
        </Text>
        <Text fontSize={["sm", "md"]} color="gray.600">
          Ce projet a été fait avec <b>React</b> et <b>Java Spring Boot</b>. Il est hébergé sur Google Cloud, conteneurisé avec Docker, et la base de données est sur Supabase.
        </Text>
      </Box>

      <Box w="100%" maxW="600px" p={[1, 4]}>
        <Flex justify="space-between" align="center" mb={2}>
          <Button size="sm" colorScheme="blue" onClick={() => setSessionModalOpen(true)}>
            Créer une séance
          </Button>
          <Button size="sm" colorScheme="gray" variant="outline" onClick={() => {
            localStorage.removeItem('authToken');
            window.location.reload();
          }}>
            Déconnexion
          </Button>
        </Flex>
        <Heading size="md" mb={4}>Séances existantes</Heading>
        <VStack align="stretch" spacing={3}>
          {seances.map(s => (
            <Box key={s.id} p={[2, 4]} border="1px solid #ccc" borderRadius="md">
              <Flex justify="space-between" mb={2} flexDir={["column", "row"]} gap={2}>
                <Text fontWeight="bold" fontSize={["md", "lg"]}>
                  {s.frequencyDay && s.frequencyMonths
                    ? `Tous les ${getJourPluriel(s.frequencyDay)} pendant ${s.frequencyMonths} mois`
                    : 'Fréquence non définie'}
                </Text>
                <Flex gap={1}>
                  <Button size="sm" mr={2} onClick={() => setEditSession(s)}>
                    Modifier
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
                  <Flex key={ex.id} justify="space-between" p={2} borderTop="1px dashed #eee" align="center">
                    <Flex align="center">
                      <Text fontSize={["sm", "md"]}>
                        {ex.nom} - {ex.series}x{ex.repetitions} (repos {ex.tempsRepos}s)
                      </Text>
                      {ex.videoUrl && (
                        <a
                          href={ex.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ marginLeft: 8, color: '#FF0000', display: 'inline-flex', alignItems: 'center' }}
                          title="Voir la vidéo YouTube"
                        >
                          <svg height="20" viewBox="0 0 24 24" width="20" style={{ marginRight: 2 }}>
                            <path fill="#FF0000" d="M21.8 8.001a2.75 2.75 0 0 0-1.94-1.94C18.2 6 12 6 12 6s-6.2 0-7.86.061A2.75 2.75 0 0 0 2.2 8.001 28.6 28.6 0 0 0 2 12a28.6 28.6 0 0 0 .2 3.999 2.75 2.75 0 0 0 1.94 1.94C5.8 18 12 18 12 18s6.2 0 7.86-.061a2.75 2.75 0 0 0 1.94-1.94A28.6 28.6 0 0 0 22 12a28.6 28.6 0 0 0-.2-3.999zM10 15V9l6 3-6 3z"/>
                          </svg>
                        </a>
                      )}
                    </Flex>
                    <Flex>
                      <Button size="xs" mr={2} onClick={() => setEditExercise({ ex, seanceId: s.id })}>
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
            <VStack spacing={3} align="stretch">
              <Text fontWeight="bold" fontSize="lg">Informations de la séance</Text>
              <Box>
                <Text fontSize="sm" mb={1}>Description</Text>
                <Input placeholder="Description" value={sessionDesc} onChange={e => setSessionDesc(e.target.value)} />
              </Box>
              <Box>
                <Text fontSize="sm" mb={1}>Jour de répétition</Text>
                <select
                  id="freq-day"
                  value={sessionFrequencyDay}
                  onChange={e => setSessionFrequencyDay(e.target.value)}
                  style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
                >
                  <option value="Monday">Lundi</option>
                  <option value="Tuesday">Mardi</option>
                  <option value="Wednesday">Mercredi</option>
                  <option value="Thursday">Jeudi</option>
                  <option value="Friday">Vendredi</option>
                  <option value="Saturday">Samedi</option>
                  <option value="Sunday">Dimanche</option>
                </select>
              </Box>
              <Box>
                <Text fontSize="sm" mb={1}>Nombre de mois</Text>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  placeholder="Nombre de mois"
                  value={sessionFrequencyMonths}
                  onChange={e => setSessionFrequencyMonths(Number(e.target.value))}
                />
              </Box>
              <Text fontSize="sm" color="gray.500" mt={2}>
                Tous les {getJourPluriel(sessionFrequencyDay)} pendant {sessionFrequencyMonths} mois
              </Text>
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
            <VStack spacing={3} align="stretch">
              <Box>
                <Text fontSize="sm" mb={1}>Nom</Text>
                <Input
                  placeholder="Nom"
                  value={exerciseData.nom}
                  onChange={e => setExerciseData({ ...exerciseData, nom: e.target.value })}
                />
              </Box>
              <Box>
                <Text fontSize="sm" mb={1}>Séries</Text>
                <Input
                  type="number"
                  placeholder="Séries"
                  value={exerciseData.series}
                  onChange={e => setExerciseData({ ...exerciseData, series: Number(e.target.value) })}
                />
              </Box>
              <Box>
                <Text fontSize="sm" mb={1}>Répétitions</Text>
                <Input
                  type="number"
                  placeholder="Répétitions"
                  value={exerciseData.repetitions}
                  onChange={e => setExerciseData({ ...exerciseData, repetitions: Number(e.target.value) })}
                />
              </Box>
              <Box>
                <Text fontSize="sm" mb={1}>Repos (s)</Text>
                <Input
                  type="number"
                  placeholder="Repos (s)"
                  value={exerciseData.tempsRepos}
                  onChange={e => setExerciseData({ ...exerciseData, tempsRepos: Number(e.target.value) })}
                />
              </Box>
              <Box>
                <Text fontSize="sm" mb={1}>URL vidéo YouTube</Text>
                <Input
                  placeholder="Uniquement si vous voulez une vidéo en particulier"
                  value={exerciseData.videoUrl || ''}
                  onChange={e => setExerciseData({ ...exerciseData, videoUrl: e.target.value })}
                />
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setExerciseModalOpen(false)} mr={3}>Annuler</Button>
            <Button colorScheme="blue" onClick={() => addExercise.mutate({
              nom: exerciseData.nom,
              series: exerciseData.series,
              repetitions: exerciseData.repetitions,
              tempsRepos: exerciseData.tempsRepos,
              videoUrl: exerciseData.videoUrl
            })}>
              Ajouter
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal for Editing Session */}
      <Modal isOpen={!!editSession} onClose={() => setEditSession(null)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Modifier la séance</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={3}>
              <Input
                placeholder="Description"
                value={editSession?.description || ''}
                onChange={e => setEditSession(editSession ? { ...editSession, description: e.target.value } : null)}
              />
              <Flex w="100%" gap={2} align="center">
                <label htmlFor="edit-freq-day" style={{ minWidth: 90 }}>Jour :</label>
                <select
                  id="edit-freq-day"
                  value={editSession?.frequencyDay || 'Friday'}
                  onChange={e => setEditSession(editSession ? { ...editSession, frequencyDay: e.target.value } : null)}
                  style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
                >
                  <option value="Monday">Lundi</option>
                  <option value="Tuesday">Mardi</option>
                  <option value="Wednesday">Mercredi</option>
                  <option value="Thursday">Jeudi</option>
                  <option value="Friday">Vendredi</option>
                  <option value="Saturday">Samedi</option>
                  <option value="Sunday">Dimanche</option>
                </select>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  placeholder="Nombre de mois"
                  value={editSession?.frequencyMonths || 1}
                  onChange={e => setEditSession(editSession ? { ...editSession, frequencyMonths: Number(e.target.value) } : null)}
                  width="130px"
                />
              </Flex>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setEditSession(null)} mr={3}>Annuler</Button>
            <Button colorScheme="blue" onClick={() => {
              if (editSession) updateSession.mutate(editSession);
              setEditSession(null);
            }}>Enregistrer</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal for Editing Exercise */}
      <Modal isOpen={!!editExercise} onClose={() => setEditExercise(null)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Modifier l'exercice</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={3}>
              <Input
                placeholder="Nom"
                value={editExercise?.ex.nom || ''}
                onChange={e => setEditExercise(editExercise ? { ...editExercise, ex: { ...editExercise.ex, nom: e.target.value } } : null)}
              />
              <Input
                type="number"
                placeholder="Séries"
                value={editExercise?.ex.series || ''}
                onChange={e => setEditExercise(editExercise ? { ...editExercise, ex: { ...editExercise.ex, series: Number(e.target.value) } } : null)}
              />
              <Input
                type="number"
                placeholder="Répétitions"
                value={editExercise?.ex.repetitions || ''}
                onChange={e => setEditExercise(editExercise ? { ...editExercise, ex: { ...editExercise.ex, repetitions: Number(e.target.value) } } : null)}
              />
              <Input
                type="number"
                placeholder="Repos (s)"
                value={editExercise?.ex.tempsRepos || ''}
                onChange={e => setEditExercise(editExercise ? { ...editExercise, ex: { ...editExercise.ex, tempsRepos: Number(e.target.value) } } : null)}
              />
              <Input
                placeholder="URL vidéo YouTube"
                value={editExercise?.ex.videoUrl || ''}
                onChange={e => setEditExercise(editExercise ? { ...editExercise, ex: { ...editExercise.ex, videoUrl: e.target.value } } : null)}
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setEditExercise(null)} mr={3}>Annuler</Button>
            <Button colorScheme="blue" onClick={() => {
              if (editExercise) updateExercise.mutate({ seanceId: editExercise.seanceId, exercice: editExercise.ex });
              setEditExercise(null);
            }}>Enregistrer</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
}
