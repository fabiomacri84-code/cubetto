"use client";

type ServerAction = (formData: FormData) => Promise<void>;

export function ImageUploadButton({
  action,
  itemId,
}: {
  action: ServerAction;
  itemId: string;
}) {
  return (
    <form action={action} className="contents">
      <input type="hidden" name="id" value={itemId} />
      <label
        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded text-text-3 hover:bg-accent-soft hover:text-accent"
        title="Carica foto"
      >
        📷
        <input
          type="file"
          name="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
          className="sr-only"
          onChange={(event) => {
            if (event.currentTarget.files?.length) {
              event.currentTarget.form?.requestSubmit();
            }
          }}
        />
      </label>
    </form>
  );
}