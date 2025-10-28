"use client";

export default function DeleteContractButton({ contractId }: { contractId: string }) {
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this contract?")) return;
    try {
      const res = await fetch(`/api/contracts/${contractId}/delete`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to delete contract");
      location.reload();
    } catch (err) {
      console.error(err);
      alert("Error deleting contract.");
    }
  };

  return (
    <button
      className="text-red-600 text-sm hover:underline"
      onClick={handleDelete}
    >
      Delete
    </button>
  );
}
