import useRefreshOnLoad from "./hooks/useRefreshOnLoad";
import AppRouter from "./routes";

const App = () => {
  const { isLoading } = useRefreshOnLoad();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <AppRouter />;
};

export default App;