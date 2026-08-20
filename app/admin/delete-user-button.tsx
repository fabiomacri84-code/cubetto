"use client";

import { useTransition } from "react";
import { deleteUser } from "../admin-actions";
import { Button } from "../components/ui/button";

export function DeleteUserButton({
  userId,
  name,
}: {
  userId: string;
  name: string;
}) {
  const [pending] = useTransition();

  return (
    <form
      action={deleteUser}
      onSubmit={(e) => {
        if (!confirm(`Eliminare l'account di ${name}? Liste e pack verranno rimossi.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="userId" value={userId} />
      <Button
        type="submit"
        variant="danger"
        size="sm"
        disabled={pending}
        className="w-full"
      >
        Elimina
      </Button>
    </form>
  );
}