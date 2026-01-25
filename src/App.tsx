import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { Layout } from "./components/Layout";
import { DashboardPage } from "./pages/DashboardPage";
import { CreatePage } from "./pages/CreatePage";
import { RaffleDetailPage } from "./pages/RaffleDetailPage";

export default function App() {
  return (
    <>
      <Toaster richColors closeButton />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/create" element={<CreatePage />} />
          <Route path="/raffle/:id" element={<RaffleDetailPage />} />
        </Route>
      </Routes>
    </>
  );
}
