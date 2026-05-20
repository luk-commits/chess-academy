import { memo, useCallback, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Paper,
  Tab,
  Tabs,
  Tooltip,
} from '@mui/material';
import { GroupSelectorList, type GroupSelectorItem } from '../groups/GroupSelectorList';
import SelfStatedSwitch from '../SelfStated/Switch';
import { SelectionStatusAlert } from './SelectionStatusAlert';

interface MobileTabsProps {
  individuals: GroupSelectorItem[];
  classes: GroupSelectorItem[];
  onCommitGroup: (groupId: number, checked: boolean) => void;
  resetKey: number;
  loading: boolean;
}

/**
 * Selektor grup dostępny tylko na mobile, używany w oknie przypisania.
 */
function MobileTabs({ individuals, classes, onCommitGroup, resetKey, loading }: MobileTabsProps) {
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ display: { lg: 'none' }, mb: 2 }}>
      <Paper elevation={8} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ bgcolor: 'primary.main' }}>
          <Tabs
            value={tab}
            onChange={(_e, v) => setTab(v)}
            variant="fullWidth"
            sx={{
              minHeight: 0,
              '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)', fontWeight: 700, py: 1.5, minHeight: 0 },
              '& .Mui-selected': { color: '#fff !important', bgcolor: 'rgba(255,255,255,0.15)' },
              '& .MuiTabs-indicator': { bgcolor: '#4caf50', height: 3 },
            }}
          >
            <Tab label={`Zawodnicy (${individuals.length})`} />
            <Tab label={`Klasy (${classes.length})`} />
          </Tabs>
        </Box>
        <GroupSelectorList
          items={tab === 0 ? individuals : classes}
          loading={loading}
          emptyText={tab === 0 ? 'Brak zawodników.' : 'Brak klas.'}
          resetKey={resetKey}
          onCommit={onCommitGroup}
        />
      </Paper>
    </Box>
  );
}

export interface TaskAssignmentSectionProps {
  individuals: GroupSelectorItem[];
  classes: GroupSelectorItem[];
  loadingGroups: boolean;
  selectedPositionCount: number;
  selectedGroupCount: number;
  taskCreating: boolean;
  assignModalOpen: boolean;
  onOpenModal: () => void;
  onCloseModal: () => void;
  sidebarResetKey: number;
  onCommitGroup: (groupId: number, checked: boolean) => void;
  publishDefaultRef: React.MutableRefObject<boolean>;
  onCreateTaskDesktop: () => void;
  onCreateTaskFromModal: () => void;
}

/**
 * Sidebar + mobilny modal do przypisywania zaznaczonych pozycji do grup.
 */
export const TaskAssignmentSection = memo(function TaskAssignmentSection({
  individuals,
  classes,
  loadingGroups,
  selectedPositionCount,
  selectedGroupCount,
  taskCreating,
  assignModalOpen,
  onOpenModal,
  onCloseModal,
  sidebarResetKey,
  onCommitGroup,
  publishDefaultRef,
  onCreateTaskDesktop,
  onCreateTaskFromModal,
}: TaskAssignmentSectionProps) {
  const handlePublishCommit = useCallback((checked: boolean) => {
    publishDefaultRef.current = checked;
  }, [publishDefaultRef]);

  const stopPropagation = useCallback((e: React.MouseEvent) => e.stopPropagation(), []);

  return (
    <>
      <Box
        sx={{
          width: 260,
          display: 'none',
          flexDirection: 'column',
          position: 'sticky',
          top: 88,
          alignSelf: 'flex-start',
          maxHeight: 'calc(100vh - 100px)',
          overflowY: 'auto',
          flexShrink: 0,
        }}
      >
        <GroupSelectorList
          title="Zawodnicy"
          items={individuals}
          loading={loadingGroups}
          emptyText="Brak zawodników."
          resetKey={sidebarResetKey}
          onCommit={onCommitGroup}
          maxHeight={200}
        />

        <Box sx={{ mt: 2 }}>
          <GroupSelectorList
            title="Klasy"
            items={classes}
            loading={loadingGroups}
            emptyText="Brak klas."
            resetKey={sidebarResetKey}
            onCommit={onCommitGroup}
            maxHeight={200}
          />
        </Box>

        <Box sx={{ mt: 2, mb: 2 }}>
          <Button
            variant="contained"
            fullWidth
            disabled={selectedPositionCount === 0 || selectedGroupCount === 0 || taskCreating}
            onClick={onCreateTaskDesktop}
            sx={{ justifyContent: 'flex-start', gap: 1, px: 2 }}
          >
            <Box sx={{ flex: 1, textAlign: 'right' }}>
              {taskCreating && <CircularProgress size={16} sx={{ mr: 1 }} />}
              Dodaj zadanie
            </Box>
            <Tooltip title="Opublikuj">
              <SelfStatedSwitch
                defaultChecked={publishDefaultRef.current}
                color="secondary"
                onCommit={handlePublishCommit}
                onClick={stopPropagation}
              />
            </Tooltip>
          </Button>
        </Box>

        <SelectionStatusAlert
          selectedPositionCount={selectedPositionCount}
          selectedGroupCount={selectedGroupCount}
        />
      </Box>

      <Dialog
        open={assignModalOpen}
        onClose={onCloseModal}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Przypisz zadania</DialogTitle>
        <DialogContent sx={{ position: 'relative' }}>
          <MobileTabs
            individuals={individuals}
            classes={classes}
            onCommitGroup={onCommitGroup}
            resetKey={sidebarResetKey}
            loading={loadingGroups}
          />
          <FormControlLabel
            control={
              <SelfStatedSwitch
                defaultChecked={publishDefaultRef.current}
                onCommit={handlePublishCommit}
              />
            }
            label="Opublikuj"
            sx={{ mt: 1 }}
          />
          {taskCreating && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(255,255,255,0.7)',
                zIndex: 1,
                borderRadius: 1,
              }}
            >
              <CircularProgress size={40} thickness={4} />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onCloseModal}>Anuluj</Button>
          <Button
            variant="contained"
            disabled={selectedPositionCount === 0 || selectedGroupCount === 0 || taskCreating}
            onClick={onCreateTaskFromModal}
          >
            Dodaj zadanie
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ display: 'block', position: 'fixed', bottom: { xs: 61, sm: 8 }, left: 0, right: 0, px: 2, zIndex: 1100 }}>
        <Button
          variant="contained"
          fullWidth
          disabled={selectedPositionCount === 0 || taskCreating}
          onClick={onOpenModal}
          sx={{ borderRadius: 3, py: 1.5 }}
        >
          Przypisz zadania
        </Button>
      </Box>
    </>
  );
});
