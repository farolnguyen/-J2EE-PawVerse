import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import CartSyncProvider from '../CartSyncProvider';
import ChatBot from '../chatbot/ChatBot';

export default function MainLayout() {
  return (
    <CartSyncProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        
        <main className="flex-1 pt-20">
          <Outlet />
        </main>

        <Footer />
        <ChatBot />
      </div>
    </CartSyncProvider>
  );
}
