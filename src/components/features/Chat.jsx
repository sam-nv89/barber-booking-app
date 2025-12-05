import React from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Send, Image as ImageIcon } from 'lucide-react';

export const Chat = ({ appointmentId, onClose }) => {
    const [messages, setMessages] = React.useState([
        { id: 1, text: 'Здравствуйте! Вы свободны чуть раньше?', sender: 'client', time: '10:00' },
        { id: 2, text: 'Добрый день! Да, можно на 15 минут раньше.', sender: 'master', time: '10:05' },
    ]);
    const [text, setText] = React.useState('');

    const handleSend = () => {
        if (!text.trim()) return;
        setMessages([...messages, { id: Date.now(), text, sender: 'me', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
        setText('');
    };

    return (
        <div className="flex flex-col h-[400px]">
            <div className="flex-1 overflow-y-auto space-y-4 p-2">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg p-3 ${msg.sender === 'me' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            <div className="text-sm">{msg.text}</div>
                            <div className="text-[10px] opacity-70 text-right mt-1">{msg.time}</div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-4 flex gap-2">
                <Button variant="outline" size="icon">
                    <ImageIcon className="h-4 w-4" />
                </Button>
                <Input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Сообщение..."
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <Button size="icon" onClick={handleSend}>
                    <Send className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};
