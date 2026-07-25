import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Perm, hasPermission } from "@/features/auth/permissions";
import {
  getSessionPermissions,
  useSession,
} from "@/features/auth/use-session";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useOnlineStatus } from "@/hooks/use-online-status";
import {
  banUser,
  deleteUser,
  listUsers,
  unbanUser,
  type PosUser,
} from "@/lib/api/users";
import { UserFormSheet } from "./user-form-sheet";
import { copy } from "./ui-copy";

const PAGE_SIZE = 20;

function roleLabel(user: PosUser) {
  const id = user.roleIds?.[0] ?? user.roles?.[0]?.id ?? "";
  const name = user.roles?.[0]?.name ?? id;
  if (id === "admin" || name === "admin") return copy.roleAdmin;
  if (id === "cashier" || name === "cashier") return copy.roleCashier;
  return name || "—";
}

export function UsersPage() {
  const { data: session } = useSession();
  const permissions = getSessionPermissions(
    session as { permissions?: string[] } | null | undefined,
  );
  const canRead = hasPermission(permissions, Perm.usersRead);
  const canCreate = hasPermission(permissions, Perm.usersCreate);
  const canUpdate = hasPermission(permissions, Perm.usersUpdate);
  const canBan = hasPermission(permissions, Perm.usersBan);
  const canDelete = hasPermission(permissions, Perm.usersDelete);
  const selfId = session?.user?.id;

  const { status } = useOnlineStatus();
  const online = status === "online";
  const qc = useQueryClient();

  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q.trim(), 300);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PosUser | null>(null);
  const [banTarget, setBanTarget] = useState<PosUser | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const infinite = useInfiniteQuery({
    queryKey: ["users", debouncedQ],
    queryFn: ({ pageParam }) =>
      listUsers({
        limit: PAGE_SIZE,
        offset: pageParam,
        q: debouncedQ || undefined,
      }),
    initialPageParam: 0,
    getNextPageParam: (last) => {
      const next = last.meta.offset + last.meta.limit;
      return next < last.meta.total ? next : undefined;
    },
    enabled: canRead && online,
  });

  const users = infinite.data?.pages.flatMap((p) => p.data) ?? [];

  const banMut = useMutation({
    mutationFn: async (user: PosUser) => {
      if (user.id === selfId) throw new Error(copy.cannotBanSelf);
      if (user.banned) return unbanUser(user.id);
      return banUser(user.id);
    },
    onSuccess: async (_res, user) => {
      toast.success(user.banned ? copy.unbanOk : copy.banOk);
      await qc.invalidateQueries({ queryKey: ["users"] });
      setBanTarget(null);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : copy.saveError);
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      if (id === selfId) throw new Error(copy.cannotDeleteSelf);
      return deleteUser(id);
    },
    onSuccess: async () => {
      toast.success(copy.deleteOk);
      await qc.invalidateQueries({ queryKey: ["users"] });
      setDeleteId(null);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : copy.saveError);
    },
  });

  if (!canRead) {
    return (
      <Alert>
        <AlertDescription>{copy.noPermission}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">{copy.title}</h1>
        {canCreate ? (
          <Button
            size="sm"
            className="h-9 rounded-xl"
            disabled={!online}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" />
            {copy.add}
          </Button>
        ) : null}
      </div>

      {!online ? (
        <Alert>
          <AlertDescription>{copy.offline}</AlertDescription>
        </Alert>
      ) : null}

      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={copy.search}
          className="h-10 rounded-xl pl-9"
          disabled={!online}
        />
      </div>

      {infinite.isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner className="size-5" />
        </div>
      ) : infinite.isError ? (
        <Alert>
          <AlertDescription>{copy.loadError}</AlertDescription>
        </Alert>
      ) : users.length === 0 ? (
        <p className="text-muted-foreground py-10 text-center text-sm">
          {copy.empty}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {users.map((user) => {
            const isSelf = user.id === selfId;
            return (
              <li
                key={user.id}
                className="border-border/60 flex flex-col gap-2 rounded-2xl border px-3 py-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {user.name || user.email}
                      {isSelf ? (
                        <span className="text-muted-foreground ml-1 text-xs">
                          ({copy.you})
                        </span>
                      ) : null}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {user.email}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge variant="secondary">{roleLabel(user)}</Badge>
                    <Badge variant={user.banned ? "destructive" : "outline"}>
                      {user.banned ? copy.banned : copy.active}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {canUpdate ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-lg"
                      disabled={!online}
                      onClick={() => {
                        setEditing(user);
                        setFormOpen(true);
                      }}
                    >
                      {copy.edit}
                    </Button>
                  ) : null}
                  {canBan && !isSelf ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-lg"
                      disabled={!online || banMut.isPending}
                      onClick={() => {
                        if (user.banned) {
                          banMut.mutate(user);
                        } else {
                          setBanTarget(user);
                        }
                      }}
                    >
                      {user.banned ? copy.unban : copy.ban}
                    </Button>
                  ) : null}
                  {canDelete && !isSelf ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8 rounded-lg"
                      disabled={!online}
                      onClick={() => setDeleteId(user.id)}
                    >
                      {copy.delete}
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {infinite.hasNextPage ? (
        <Button
          variant="outline"
          className="rounded-xl"
          disabled={infinite.isFetchingNextPage}
          onClick={() => void infinite.fetchNextPage()}
        >
          {infinite.isFetchingNextPage ? <Spinner className="size-4" /> : "…"}
        </Button>
      ) : null}

      <UserFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editing}
      />

      <AlertDialog
        open={Boolean(banTarget)}
        onOpenChange={(open) => {
          if (!open) setBanTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.banConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{copy.banConfirmDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{copy.cancel}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={banMut.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (banTarget) banMut.mutate(banTarget);
              }}
            >
              {copy.ban}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.deleteConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy.deleteConfirmDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{copy.cancel}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteMut.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (deleteId) deleteMut.mutate(deleteId);
              }}
            >
              {deleteMut.isPending ? copy.deleting : copy.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
