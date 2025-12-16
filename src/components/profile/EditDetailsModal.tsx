import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Edit2, Plus, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DetailItem {
  id: string;
  detail_type: string;
  title: string;
  subtitle: string | null;
  is_visible: boolean;
  is_current: boolean;
  display_order: number;
  isNew?: boolean;
}

interface EditDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export function EditDetailsModal({ isOpen, onClose, onSave }: EditDetailsModalProps) {
  const [workItems, setWorkItems] = useState<DetailItem[]>([]);
  const [educationItems, setEducationItems] = useState<DetailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<{ type: 'work' | 'education'; id: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchDetails();
    }
  }, [isOpen]);

  const fetchDetails = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profile_details")
        .select("*")
        .eq("user_id", user.id)
        .order("display_order", { ascending: true });

      if (error) throw error;

      const work = (data || []).filter(d => d.detail_type === 'work');
      const education = (data || []).filter(d => d.detail_type === 'education');

      setWorkItems(work);
      setEducationItems(education);
    } catch (error) {
      console.error("Error fetching details:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = (type: 'work' | 'education', id: string) => {
    if (type === 'work') {
      setWorkItems(items => items.map(item => 
        item.id === id ? { ...item, is_visible: !item.is_visible } : item
      ));
    } else {
      setEducationItems(items => items.map(item => 
        item.id === id ? { ...item, is_visible: !item.is_visible } : item
      ));
    }
  };

  const updateItemText = (type: 'work' | 'education', id: string, title: string) => {
    if (type === 'work') {
      setWorkItems(items => items.map(item => 
        item.id === id ? { ...item, title } : item
      ));
    } else {
      setEducationItems(items => items.map(item => 
        item.id === id ? { ...item, title } : item
      ));
    }
  };

  const addNewItem = (type: 'work' | 'education') => {
    const newItem: DetailItem = {
      id: `new-${Date.now()}`,
      detail_type: type,
      title: type === 'work' ? 'Làm việc tại ' : 'Học tại ',
      subtitle: null,
      is_visible: true,
      is_current: true,
      display_order: type === 'work' ? workItems.length : educationItems.length,
      isNew: true,
    };

    if (type === 'work') {
      setWorkItems([...workItems, newItem]);
    } else {
      setEducationItems([...educationItems, newItem]);
    }
    setEditingItem({ type, id: newItem.id });
  };

  const deleteItem = (type: 'work' | 'education', id: string) => {
    if (type === 'work') {
      setWorkItems(items => items.filter(item => item.id !== id));
    } else {
      setEducationItems(items => items.filter(item => item.id !== id));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Delete all existing details for this user
      await supabase
        .from("profile_details")
        .delete()
        .eq("user_id", user.id);

      // Insert all current items
      const allItems = [...workItems, ...educationItems].map((item, index) => ({
        user_id: user.id,
        detail_type: item.detail_type,
        title: item.title,
        subtitle: item.subtitle,
        is_visible: item.is_visible,
        is_current: item.is_current,
        display_order: index,
      }));

      if (allItems.length > 0) {
        const { error } = await supabase
          .from("profile_details")
          .insert(allItems);

        if (error) throw error;
      }

      toast({
        title: "Thành công",
        description: "Đã lưu thông tin chi tiết",
      });
      
      onSave?.();
      onClose();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể lưu thông tin",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderDetailItem = (
    item: DetailItem, 
    type: 'work' | 'education',
  ) => {
    const isEditing = editingItem?.type === type && editingItem?.id === item.id;

    return (
      <div key={item.id} className="flex items-center gap-3 py-2 group">
        <Switch 
          checked={item.is_visible} 
          onCheckedChange={() => toggleVisibility(type, item.id)}
          className="data-[state=checked]:bg-primary"
        />
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <Input
              value={item.title}
              onChange={(e) => updateItemText(type, item.id, e.target.value)}
              onBlur={() => setEditingItem(null)}
              onKeyDown={(e) => e.key === 'Enter' && setEditingItem(null)}
              autoFocus
              className="h-8"
            />
          ) : (
            <span className="text-sm text-foreground truncate block">{item.title}</span>
          )}
        </div>
        <button 
          onClick={() => setEditingItem({ type, id: item.id })}
          className="p-2 hover:bg-muted rounded-full transition-colors shrink-0"
        >
          <Edit2 className="w-4 h-4 text-muted-foreground" />
        </button>
        <button 
          onClick={() => deleteItem(type, item.id)}
          className="p-2 hover:bg-destructive/10 rounded-full transition-colors shrink-0 opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </button>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">Chỉnh sửa chi tiết</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground text-center pb-4 border-b border-border">
          Thông tin bạn chọn sẽ ở chế độ Công khai và hiển thị ở đầu trang cá nhân của bạn.
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Công việc */}
            <div>
              <h4 className="font-semibold text-foreground mb-3">Công việc</h4>
              <div className="space-y-1">
                {workItems.map(item => renderDetailItem(item, 'work'))}
              </div>
              <button 
                onClick={() => addNewItem('work')}
                className="flex items-center gap-2 text-primary hover:underline text-sm mt-3"
              >
                <Plus className="w-4 h-4" />
                Thêm nơi làm việc
              </button>
            </div>

            {/* Học vấn */}
            <div>
              <h4 className="font-semibold text-foreground mb-3">Học vấn</h4>
              <div className="space-y-1">
                {educationItems.map(item => renderDetailItem(item, 'education'))}
              </div>
              <button 
                onClick={() => addNewItem('education')}
                className="flex items-center gap-2 text-primary hover:underline text-sm mt-3"
              >
                <Plus className="w-4 h-4" />
                Thêm trường học
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Lưu
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}