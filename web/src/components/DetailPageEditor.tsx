'use client';

import { useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import {
  Upload,
  Type,
  Trash2,
  Download,
  MoveUp,
  MoveDown,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
  Minus,
  RotateCcw,
  FolderOpen,
  Image,
  X,
  Frame,
  Layout,
  Award,
  Leaf,
  Truck,
  MapPin,
  Fish,
  Apple,
  ChevronLeft,
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Group,
  Ungroup,
  Copy,
  Clipboard,
  Undo2,
  Redo2,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  GripVertical,
} from 'lucide-react';
import * as fabric from 'fabric';

interface ImageFile {
  name: string;
  dataUrl: string;
  file: File;
}

// 프레임 타입 정의
interface FrameTemplate {
  id: string;
  name: string;
  icon: React.ReactNode;
  type: 'circle' | 'rounded' | 'wave' | 'leaf' | 'oval';
  width: number;
  height: number;
}

// 템플릿 타입 정의
interface ProductTemplate {
  id: string;
  name: string;
  category: 'intro' | 'fresh' | 'info' | 'origin';
  preview: string; // 미리보기 설명
}

// 뱃지 타입 정의
interface BadgeTemplate {
  id: string;
  text: string;
  bgColor: string;
  textColor: string;
  icon?: string;
}

// 프레임 목록
const FRAMES: FrameTemplate[] = [
  { id: 'circle', name: '원형', icon: <div className="w-6 h-6 rounded-full border-2 border-current" />, type: 'circle', width: 300, height: 300 },
  { id: 'rounded', name: '둥근사각', icon: <div className="w-6 h-6 rounded-lg border-2 border-current" />, type: 'rounded', width: 300, height: 300 },
  { id: 'oval', name: '타원형', icon: <div className="w-8 h-5 rounded-full border-2 border-current" />, type: 'oval', width: 350, height: 250 },
  { id: 'wave', name: '물결', icon: <Fish size={20} />, type: 'wave', width: 300, height: 300 },
  { id: 'leaf', name: '나뭇잎', icon: <Leaf size={20} />, type: 'leaf', width: 300, height: 300 },
];

// 농수산물 템플릿 목록
const TEMPLATES: ProductTemplate[] = [
  { id: 'product-intro', name: '상품 소개', category: 'intro', preview: '상품명 + 원산지 + 중량' },
  { id: 'fresh-badge', name: '신선도 강조', category: 'fresh', preview: '산지직송 + 이미지' },
  { id: 'box-info', name: '박스 구성', category: 'info', preview: '구성 수량 안내' },
  { id: 'origin-info', name: '원산지 표시', category: 'origin', preview: '원산지 강조' },
];

// 뱃지 목록
const BADGES: BadgeTemplate[] = [
  { id: 'direct', text: '산지직송', bgColor: '#2E7D32', textColor: '#FFFFFF', icon: '🚚' },
  { id: 'today', text: '오늘 수확', bgColor: '#F57C00', textColor: '#FFFFFF', icon: '🌅' },
  { id: 'organic', text: '무농약', bgColor: '#558B2F', textColor: '#FFFFFF', icon: '🌱' },
  { id: 'gap', text: 'GAP인증', bgColor: '#1565C0', textColor: '#FFFFFF', icon: '✓' },
  { id: 'season', text: '제철과일', bgColor: '#C62828', textColor: '#FFFFFF', icon: '🍎' },
  { id: 'premium', text: '프리미엄', bgColor: '#6A1B9A', textColor: '#FFFFFF', icon: '⭐' },
  { id: 'sale', text: '특가', bgColor: '#D32F2F', textColor: '#FFFFFF', icon: '🔥' },
  { id: 'new', text: '햇과일', bgColor: '#00838F', textColor: '#FFFFFF', icon: '🆕' },
];

type LeftPanelTab = 'images' | 'frames' | 'templates' | 'badges';

// 툴팁 컴포넌트
interface TooltipProps {
  children: ReactNode;
  text: string;
  shortcut?: string;
}

function Tooltip({ children, text, shortcut }: TooltipProps) {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        x: rect.left + rect.width / 2,
        y: rect.bottom + 8,
      });
    }
    setShow(true);
  };

  return (
    <div
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          className="fixed z-50 px-2 py-1.5 text-xs bg-[var(--color-gray-900)] text-white rounded-lg shadow-lg whitespace-nowrap pointer-events-none"
          style={{
            left: position.x,
            top: position.y,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="font-medium">{text}</div>
          {shortcut && (
            <div className="text-[var(--color-gray-400)] text-[10px] mt-0.5">{shortcut}</div>
          )}
        </div>
      )}
    </div>
  );
}

interface DetailPageEditorProps {
  onExport?: (imageDataUrl: string) => void;
  initialImages?: string[];
}

// 레이어 아이템 인터페이스
interface LayerItem {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked: boolean;
  object: fabric.FabricObject;
}

export default function DetailPageEditor({ onExport, initialImages = [] }: DetailPageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [canvasHeight, setCanvasHeight] = useState(1000);
  const [folderImages, setFolderImages] = useState<ImageFile[]>([]);
  const [draggedImage, setDraggedImage] = useState<string | null>(null);
  const [leftPanelTab, setLeftPanelTab] = useState<LeftPanelTab>('images');
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [clipboard, setClipboard] = useState<fabric.FabricObject | null>(null);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [dragOverLayerId, setDragOverLayerId] = useState<string | null>(null);
  const [highlightedFrame, setHighlightedFrame] = useState<fabric.FabricObject | null>(null);
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingLayerName, setEditingLayerName] = useState('');
  const [textOptions, setTextOptions] = useState({
    fontSize: 24,
    fontFamily: 'Noto Sans KR',
    fill: '#000000',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'left',
  });

  // 쿠팡 권장 너비
  const COUPANG_WIDTH = 780;

  // Fabric.js 초기화
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const timer = setTimeout(() => {
      if (canvasRef.current && !fabricCanvasRef.current) {
        try {
          fabricCanvasRef.current = new fabric.Canvas(canvasRef.current, {
            width: COUPANG_WIDTH,
            height: canvasHeight,
            backgroundColor: '#ffffff',
            selection: true,
            preserveObjectStacking: true, // 선택 시 레이어 순서 유지
            // Ctrl/Cmd 키로 다중 선택 활성화 (기본값은 shiftKey)
            selectionKey: ['ctrlKey', 'metaKey'] as any,
          });

          // 선택 이벤트 처리
          fabricCanvasRef.current.on('selection:created', handleSelection);
          fabricCanvasRef.current.on('selection:updated', handleSelection);
          fabricCanvasRef.current.on('selection:cleared', () => setSelectedObject(null));

          // 객체 추가/제거/수정 시 레이어 업데이트
          fabricCanvasRef.current.on('object:added', updateLayers);
          fabricCanvasRef.current.on('object:removed', updateLayers);
          fabricCanvasRef.current.on('object:modified', saveHistory);

          setIsLoaded(true);

          // 초기 이미지 로드
          if (initialImages.length > 0) {
            loadInitialImages(initialImages);
          }
        } catch (error) {
          console.error('Fabric.js 초기화 오류:', error);
        }
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, []);

  const handleSelection = (e: any) => {
    // 캔버스에서 직접 activeObject를 가져와야 다중 선택(ActiveSelection)도 제대로 처리됨
    const activeObject = fabricCanvasRef.current?.getActiveObject();
    setSelectedObject(activeObject || null);

    // 텍스트 옵션 업데이트 (단일 텍스트 선택 시)
    const selected = e.selected?.[0];
    if (selected && selected.type === 'textbox') {
      setTextOptions({
        fontSize: selected.fontSize || 24,
        fontFamily: selected.fontFamily || 'Noto Sans KR',
        fill: selected.fill || '#000000',
        fontWeight: selected.fontWeight || 'normal',
        fontStyle: selected.fontStyle || 'normal',
        textAlign: selected.textAlign || 'left',
      });
    }
  };

  // 레이어 목록 업데이트
  const updateLayers = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const objects = fabricCanvasRef.current.getObjects();
    const newLayers: LayerItem[] = objects.map((obj: any, index: number) => {
      // 객체에 고유 ID가 없으면 생성
      if (!obj._customId) {
        obj._customId = `layer_${Date.now()}_${index}`;
      }

      // 객체 이름 결정
      let name = obj._customName || '';
      if (!name) {
        if (obj.type === 'textbox' || obj.type === 'text') {
          name = obj.text?.substring(0, 15) || '텍스트';
          if (obj.text?.length > 15) name += '...';
        } else if (obj.type === 'image') {
          name = '이미지';
        } else if (obj.type === 'circle') {
          name = '원형';
        } else if (obj.type === 'ellipse') {
          name = '타원';
        } else if (obj.type === 'rect') {
          name = '사각형';
        } else if (obj.type === 'group') {
          name = '그룹';
        } else {
          name = obj.type || '객체';
        }
      }

      return {
        id: obj._customId,
        name,
        type: obj.type,
        visible: obj.visible !== false,
        locked: obj.selectable === false,
        object: obj,
      };
    });

    // 레이어는 역순으로 표시 (맨 위 객체가 목록 맨 위)
    setLayers(newLayers.reverse());
  }, []);

  // 히스토리 저장
  const saveHistory = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const json = JSON.stringify(fabricCanvasRef.current.toJSON());
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(json);
      // 최대 50개까지만 저장
      if (newHistory.length > 50) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  // Undo
  const undo = useCallback(() => {
    if (historyIndex <= 0 || !fabricCanvasRef.current) return;

    const newIndex = historyIndex - 1;
    fabricCanvasRef.current.loadFromJSON(JSON.parse(history[newIndex]), () => {
      fabricCanvasRef.current.renderAll();
      updateLayers();
    });
    setHistoryIndex(newIndex);
  }, [history, historyIndex, updateLayers]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1 || !fabricCanvasRef.current) return;

    const newIndex = historyIndex + 1;
    fabricCanvasRef.current.loadFromJSON(JSON.parse(history[newIndex]), () => {
      fabricCanvasRef.current.renderAll();
      updateLayers();
    });
    setHistoryIndex(newIndex);
  }, [history, historyIndex, updateLayers]);

  // 복사
  const copyObject = useCallback(async () => {
    if (!selectedObject) return;
    try {
      const cloned = await selectedObject.clone();
      setClipboard(cloned);
    } catch (error) {
      console.error('복사 실패:', error);
    }
  }, [selectedObject]);

  // 붙여넣기
  const pasteObject = useCallback(async () => {
    if (!clipboard || !fabricCanvasRef.current) return;

    try {
      const cloned = await clipboard.clone();
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20,
      });
      fabricCanvasRef.current.add(cloned);
      fabricCanvasRef.current.setActiveObject(cloned);
      fabricCanvasRef.current.renderAll();
      saveHistory();
    } catch (error) {
      console.error('붙여넣기 실패:', error);
    }
  }, [clipboard, saveHistory]);

  // 그룹화 (Fabric.js 6 호환)
  const groupObjects = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const activeObject = fabricCanvasRef.current.getActiveObject();

    // Fabric.js 6에서는 type이 'activeselection' (소문자) 또는 'activeSelection'일 수 있음
    // 또한 activeObject가 ActiveSelection 인스턴스인지 확인
    const isActiveSelection = activeObject && (
      activeObject.type === 'activeSelection' ||
      activeObject.type === 'activeselection' ||
      activeObject instanceof fabric.ActiveSelection
    );

    if (!isActiveSelection) {
      alert('그룹화할 여러 객체를 선택해주세요.\n(캔버스에서 드래그하거나 Ctrl/Cmd + 클릭으로 여러 객체 선택)');
      return;
    }

    const activeSelection = activeObject as fabric.ActiveSelection;
    const objects = activeSelection.getObjects();

    if (objects.length < 2) {
      alert('2개 이상의 객체를 선택해주세요.');
      return;
    }

    // 그룹의 중심 위치 저장
    const centerPoint = activeSelection.getCenterPoint();

    // ActiveSelection 해제
    fabricCanvasRef.current.discardActiveObject();

    // 기존 객체들 제거
    objects.forEach((obj) => {
      fabricCanvasRef.current.remove(obj);
    });

    // 새 그룹 생성 - 객체들의 상대 위치를 유지하면서 그룹화
    const group = new fabric.Group(objects, {
      left: centerPoint.x,
      top: centerPoint.y,
      originX: 'center',
      originY: 'center',
    });

    // 그룹 추가
    (group as any)._customName = '그룹';
    (group as any)._customId = `group_${Date.now()}`;
    fabricCanvasRef.current.add(group);
    fabricCanvasRef.current.setActiveObject(group);
    fabricCanvasRef.current.requestRenderAll();
    updateLayers();
    saveHistory();
  }, [updateLayers, saveHistory]);

  // 그룹 해제 (Fabric.js 6 호환)
  const ungroupObjects = useCallback(() => {
    if (!fabricCanvasRef.current || !selectedObject) return;

    if (selectedObject.type !== 'group') {
      alert('그룹을 선택해주세요');
      return;
    }

    const group = selectedObject as fabric.Group;
    const objects = group.getObjects();
    const groupLeft = group.left || 0;
    const groupTop = group.top || 0;

    // 그룹 제거
    fabricCanvasRef.current.remove(group);

    // 그룹 내 객체들을 개별적으로 캔버스에 추가
    objects.forEach((obj) => {
      // 그룹 해제 시 위치 보정
      const objLeft = (obj.left || 0) + groupLeft + (group.width || 0) / 2;
      const objTop = (obj.top || 0) + groupTop + (group.height || 0) / 2;
      obj.set({
        left: objLeft,
        top: objTop,
      });
      obj.setCoords();
      fabricCanvasRef.current.add(obj);
    });

    // 해제된 객체들을 ActiveSelection으로 선택
    const selection = new fabric.ActiveSelection(objects, {
      canvas: fabricCanvasRef.current,
    });
    fabricCanvasRef.current.setActiveObject(selection);
    fabricCanvasRef.current.requestRenderAll();
    updateLayers();
    saveHistory();
  }, [selectedObject, updateLayers, saveHistory]);

  // 레이어 가시성 토글
  const toggleLayerVisibility = useCallback((layerId: string) => {
    if (!fabricCanvasRef.current) return;

    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      layer.object.set('visible', !layer.visible);
      fabricCanvasRef.current.renderAll();
      updateLayers();
    }
  }, [layers, updateLayers]);

  // 레이어 잠금 토글
  const toggleLayerLock = useCallback((layerId: string) => {
    if (!fabricCanvasRef.current) return;

    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      const newLocked = !layer.locked;
      layer.object.set({
        selectable: !newLocked,
        evented: !newLocked,
      });
      fabricCanvasRef.current.renderAll();
      updateLayers();
    }
  }, [layers, updateLayers]);

  // 레이어 선택 (Ctrl/Cmd 키로 다중 선택 지원)
  const selectLayer = useCallback((layerId: string, event?: React.MouseEvent) => {
    if (!fabricCanvasRef.current) return;

    const layer = layers.find(l => l.id === layerId);
    if (!layer || layer.locked) return;

    const isMultiSelect = event?.metaKey || event?.ctrlKey;

    if (isMultiSelect) {
      // 다중 선택 모드
      const currentActive = fabricCanvasRef.current.getActiveObject();

      if (!currentActive) {
        // 현재 선택된 것이 없으면 단일 선택
        fabricCanvasRef.current.setActiveObject(layer.object);
      } else {
        // 다중 선택 상태인지 확인 (소문자/대문자 모두 체크)
        const isActiveSelection = currentActive.type === 'activeSelection' ||
          currentActive.type === 'activeselection' ||
          currentActive instanceof fabric.ActiveSelection;

        if (isActiveSelection) {
          // 이미 다중 선택 상태
          const activeSelection = currentActive as fabric.ActiveSelection;
          const objects = activeSelection.getObjects();

          if (objects.includes(layer.object)) {
            // 이미 선택된 객체면 선택 해제
            const newObjects = objects.filter(obj => obj !== layer.object);
            fabricCanvasRef.current.discardActiveObject();
            if (newObjects.length === 1) {
              fabricCanvasRef.current.setActiveObject(newObjects[0]);
            } else if (newObjects.length > 1) {
              const newSelection = new fabric.ActiveSelection(newObjects, {
                canvas: fabricCanvasRef.current,
              });
              fabricCanvasRef.current.setActiveObject(newSelection);
            }
          } else {
            // 새 객체 추가
            const newObjects = [...objects, layer.object];
            fabricCanvasRef.current.discardActiveObject();
            const newSelection = new fabric.ActiveSelection(newObjects, {
              canvas: fabricCanvasRef.current,
            });
            fabricCanvasRef.current.setActiveObject(newSelection);
          }
        } else {
          // 단일 선택 상태에서 다중 선택으로 전환
          if (currentActive === layer.object) {
            // 같은 객체 클릭하면 선택 해제
            fabricCanvasRef.current.discardActiveObject();
          } else {
            // 다른 객체 클릭하면 ActiveSelection 생성
            const selection = new fabric.ActiveSelection([currentActive, layer.object], {
              canvas: fabricCanvasRef.current,
            });
            fabricCanvasRef.current.setActiveObject(selection);
          }
        }
      }
    } else {
      // 단일 선택
      fabricCanvasRef.current.setActiveObject(layer.object);
    }

    fabricCanvasRef.current.renderAll();
    // 선택 상태 업데이트
    setSelectedObject(fabricCanvasRef.current.getActiveObject() || null);
  }, [layers]);

  // 레이어 이름 변경 시작
  const startEditingLayerName = useCallback((layerId: string, currentName: string) => {
    setEditingLayerId(layerId);
    setEditingLayerName(currentName);
  }, []);

  // 레이어 이름 변경 완료
  const finishEditingLayerName = useCallback(() => {
    if (!editingLayerId || !fabricCanvasRef.current) {
      setEditingLayerId(null);
      return;
    }

    const layer = layers.find(l => l.id === editingLayerId);
    if (layer && editingLayerName.trim()) {
      (layer.object as any)._customName = editingLayerName.trim();
      updateLayers();
    }

    setEditingLayerId(null);
    setEditingLayerName('');
  }, [editingLayerId, editingLayerName, layers, updateLayers]);

  // 레이어 이름 변경 취소
  const cancelEditingLayerName = useCallback(() => {
    setEditingLayerId(null);
    setEditingLayerName('');
  }, []);

  // 레이어 순서 변경 (맨 앞으로)
  const bringToFront = useCallback(() => {
    if (!fabricCanvasRef.current || !selectedObject) return;
    fabricCanvasRef.current.bringObjectToFront(selectedObject);
    fabricCanvasRef.current.renderAll();
    updateLayers();
    saveHistory();
  }, [selectedObject, updateLayers, saveHistory]);

  // 레이어 순서 변경 (맨 뒤로)
  const sendToBack = useCallback(() => {
    if (!fabricCanvasRef.current || !selectedObject) return;
    fabricCanvasRef.current.sendObjectToBack(selectedObject);
    fabricCanvasRef.current.renderAll();
    updateLayers();
    saveHistory();
  }, [selectedObject, updateLayers, saveHistory]);

  // 정렬 - 가로 가운데
  const alignHorizontalCenter = useCallback(() => {
    if (!fabricCanvasRef.current || !selectedObject) return;
    selectedObject.set('left', (COUPANG_WIDTH - selectedObject.getScaledWidth()) / 2);
    fabricCanvasRef.current.renderAll();
    saveHistory();
  }, [selectedObject, saveHistory]);

  // 정렬 - 세로 가운데
  const alignVerticalCenter = useCallback(() => {
    if (!fabricCanvasRef.current || !selectedObject) return;
    selectedObject.set('top', (canvasHeight - selectedObject.getScaledHeight()) / 2);
    fabricCanvasRef.current.renderAll();
    saveHistory();
  }, [selectedObject, canvasHeight, saveHistory]);

  // 레이어 드래그 시작
  const handleLayerDragStart = useCallback((e: React.DragEvent, layerId: string) => {
    setDraggedLayerId(layerId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', layerId); // 드래그 데이터 설정
    // 드래그 이미지를 투명하게 (window.Image 사용 - lucide Image와 충돌 방지)
    const dragImg = new window.Image();
    dragImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(dragImg, 0, 0);
  }, []);

  // 레이어 드래그 오버
  const handleLayerDragOver = useCallback((e: React.DragEvent, layerId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedLayerId !== layerId) {
      setDragOverLayerId(layerId);
    }
  }, [draggedLayerId]);

  // 레이어 드래그 리브
  const handleLayerDragLeave = useCallback(() => {
    setDragOverLayerId(null);
  }, []);

  // 레이어 드롭 - 순서 변경
  const handleLayerDrop = useCallback((e: React.DragEvent, targetLayerId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const canvas = fabricCanvasRef.current;
    if (!canvas || !draggedLayerId || draggedLayerId === targetLayerId) {
      setDraggedLayerId(null);
      setDragOverLayerId(null);
      return;
    }

    // 캔버스에서 직접 객체 찾기
    const objects = canvas.getObjects();
    const draggedObj = objects.find((obj: any) => obj._customId === draggedLayerId);
    const targetObj = objects.find((obj: any) => obj._customId === targetLayerId);

    if (!draggedObj || !targetObj) {
      setDraggedLayerId(null);
      setDragOverLayerId(null);
      return;
    }

    // 캔버스에서의 현재 인덱스
    const draggedIndex = objects.indexOf(draggedObj);
    const targetIndex = objects.indexOf(targetObj);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedLayerId(null);
      setDragOverLayerId(null);
      return;
    }

    // 이동 횟수 및 방향 계산
    // layers는 역순이므로: layers[0] = objects의 마지막 = 캔버스 맨 위
    // 레이어 패널에서 위에서 아래로 드래그 = draggedLayerIndex < targetLayerIndex
    // 이는 캔버스에서 draggedIndex > targetIndex (더 높은 곳에서 낮은 곳으로)
    const moveCount = Math.abs(draggedIndex - targetIndex);

    if (draggedIndex > targetIndex) {
      // 캔버스에서 뒤로 (인덱스 감소) = 레이어 패널에서 아래로
      for (let i = 0; i < moveCount; i++) {
        canvas.sendObjectBackwards(draggedObj);
      }
    } else {
      // 캔버스에서 앞으로 (인덱스 증가) = 레이어 패널에서 위로
      for (let i = 0; i < moveCount; i++) {
        canvas.bringObjectForward(draggedObj);
      }
    }

    canvas.renderAll();
    updateLayers();
    saveHistory();

    setDraggedLayerId(null);
    setDragOverLayerId(null);
  }, [draggedLayerId, updateLayers, saveHistory]);

  // 레이어 드래그 종료
  const handleLayerDragEnd = useCallback(() => {
    setDraggedLayerId(null);
    setDragOverLayerId(null);
  }, []);

  const loadInitialImages = async (images: string[]) => {
    if (!fabricCanvasRef.current) return;

    let currentTop = 20;
    for (const imageUrl of images) {
      try {
        const img = await fabric.FabricImage.fromURL(imageUrl, { crossOrigin: 'anonymous' });
        const scale = (COUPANG_WIDTH - 40) / (img.width || 400);
        img.scale(scale);
        img.set({ left: 20, top: currentTop });
        fabricCanvasRef.current.add(img);
        currentTop += img.getScaledHeight() + 20;
      } catch (error) {
        console.error('이미지 로드 실패:', imageUrl, error);
      }
    }

    if (currentTop > canvasHeight) {
      updateCanvasHeight(currentTop + 100);
    }
    fabricCanvasRef.current.renderAll();
  };

  const updateCanvasHeight = (newHeight: number) => {
    if (fabricCanvasRef.current) {
      setCanvasHeight(newHeight);
      fabricCanvasRef.current.setHeight(newHeight);
      fabricCanvasRef.current.renderAll();
    }
  };

  // 폴더 선택 (File System Access API)
  const handleFolderSelect = async () => {
    try {
      // @ts-ignore - File System Access API
      const dirHandle = await window.showDirectoryPicker();
      const images: ImageFile[] = [];

      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file') {
          const file = await entry.getFile();
          if (file.type.startsWith('image/')) {
            const dataUrl = await readFileAsDataUrl(file);
            images.push({
              name: file.name,
              dataUrl,
              file,
            });
          }
        }
      }

      // 파일명 기준 정렬
      images.sort((a, b) => a.name.localeCompare(b.name));
      setFolderImages(images);
    } catch (error) {
      // 사용자가 취소했거나 API 미지원
      if ((error as Error).name !== 'AbortError') {
        alert('폴더 선택이 지원되지 않는 브라우저입니다.\nChrome 또는 Edge를 사용해주세요.');
      }
    }
  };

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // 이미지를 캔버스에 추가
  const addImageToCanvas = async (dataUrl: string, x?: number, y?: number) => {
    if (!fabricCanvasRef.current) return;

    try {
      const img = await fabric.FabricImage.fromURL(dataUrl);
      const scale = Math.min((COUPANG_WIDTH - 40) / (img.width || 400), 1);
      img.scale(scale);

      if (x !== undefined && y !== undefined) {
        // 드롭 위치에 배치
        img.set({ left: x - (img.getScaledWidth() / 2), top: y - (img.getScaledHeight() / 2) });
      } else {
        // 기존 객체들 아래에 배치
        const objects = fabricCanvasRef.current.getObjects();
        let maxBottom = 20;
        objects.forEach((obj: any) => {
          const bottom = obj.top + obj.getScaledHeight();
          if (bottom > maxBottom) maxBottom = bottom;
        });
        img.set({ left: 20, top: maxBottom + 20 });
      }

      fabricCanvasRef.current.add(img);

      // 캔버스 높이 자동 조정
      const imgBottom = img.top! + img.getScaledHeight() + 100;
      if (imgBottom > canvasHeight) {
        updateCanvasHeight(imgBottom);
      }

      fabricCanvasRef.current.renderAll();
    } catch (error) {
      console.error('이미지 추가 실패:', error);
    }
  };

  // 드래그 시작
  const handleDragStart = (e: React.DragEvent, dataUrl: string) => {
    setDraggedImage(dataUrl);
    e.dataTransfer.effectAllowed = 'copy';
  };

  // 드롭 위치에 프레임이 있는지 확인
  const findFrameAtPosition = (x: number, y: number): fabric.FabricObject | null => {
    if (!fabricCanvasRef.current) return null;

    const objects = fabricCanvasRef.current.getObjects();
    // 위에서부터 검색 (나중에 추가된 객체가 위에 있음)
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i] as any;
      if (obj.isFrame && obj.containsPoint({ x, y })) {
        return obj;
      }
    }
    return null;
  };

  // 이미지를 프레임에 클리핑하여 추가
  const addImageToFrame = async (dataUrl: string, frame: fabric.FabricObject) => {
    if (!fabricCanvasRef.current) return;

    try {
      const img = await fabric.FabricImage.fromURL(dataUrl);
      const frameObj = frame as any;

      // 프레임 위치와 크기 가져오기
      const frameLeft = frameObj.left || 0;
      const frameTop = frameObj.top || 0;
      const frameScaleX = frameObj.scaleX || 1;
      const frameScaleY = frameObj.scaleY || 1;

      // 프레임의 실제 크기 계산
      let frameWidth: number;
      let frameHeight: number;
      let frameRadius: number = 0;
      let frameRx: number = 0;
      let frameRy: number = 0;

      if (frameObj.type === 'circle') {
        frameRadius = (frameObj.radius || 150) * frameScaleX;
        frameWidth = frameRadius * 2;
        frameHeight = frameRadius * 2;
      } else if (frameObj.type === 'ellipse') {
        frameRx = (frameObj.rx || 150) * frameScaleX;
        frameRy = (frameObj.ry || 100) * frameScaleY;
        frameWidth = frameRx * 2;
        frameHeight = frameRy * 2;
      } else {
        frameWidth = (frameObj.width || 300) * frameScaleX;
        frameHeight = (frameObj.height || 300) * frameScaleY;
        frameRx = (frameObj.rx || 0) * frameScaleX;
        frameRy = (frameObj.ry || 0) * frameScaleY;
      }

      // 프레임 중심 계산
      const frameCenterX = frameLeft + frameWidth / 2;
      const frameCenterY = frameTop + frameHeight / 2;

      // 이미지가 프레임을 덮도록 스케일 계산 (cover 방식)
      const imgWidth = img.width || 1;
      const imgHeight = img.height || 1;
      const imgScaleX = frameWidth / imgWidth;
      const imgScaleY = frameHeight / imgHeight;
      const imgScale = Math.max(imgScaleX, imgScaleY);

      // 클리핑 마스크 생성 - 그룹의 로컬 좌표계 기준 (중앙이 0,0)
      let clipMask: fabric.FabricObject;

      if (frameObj.type === 'circle') {
        clipMask = new fabric.Circle({
          radius: frameRadius,
          left: 0,
          top: 0,
          originX: 'center',
          originY: 'center',
        });
      } else if (frameObj.type === 'ellipse') {
        clipMask = new fabric.Ellipse({
          rx: frameRx,
          ry: frameRy,
          left: 0,
          top: 0,
          originX: 'center',
          originY: 'center',
        });
      } else {
        clipMask = new fabric.Rect({
          width: frameWidth,
          height: frameHeight,
          rx: frameRx,
          ry: frameRy,
          left: 0,
          top: 0,
          originX: 'center',
          originY: 'center',
        });
      }

      // 이미지 스케일 설정 (그룹 내에서 중앙 정렬)
      img.set({
        scaleX: imgScale,
        scaleY: imgScale,
        originX: 'center',
        originY: 'center',
        left: 0,
        top: 0,
      });

      // 그룹 생성 - clipPath를 그룹에 적용
      const group = new fabric.Group([img], {
        left: frameCenterX,
        top: frameCenterY,
        originX: 'center',
        originY: 'center',
        clipPath: clipMask,
      });

      // 원본 프레임 제거
      fabricCanvasRef.current.remove(frame);

      // 그룹 추가
      fabricCanvasRef.current.add(group);
      fabricCanvasRef.current.setActiveObject(group);

      // 커스텀 속성 설정
      (group as any)._customName = '프레임 이미지';
      (group as any).isFramedImage = true;
      (group as any).frameType = frameObj.frameType;

      fabricCanvasRef.current.requestRenderAll();
      updateLayers();
      saveHistory();
    } catch (error) {
      console.error('프레임 이미지 추가 실패:', error);
    }
  };

  // 캔버스 영역에 드롭
  const handleCanvasDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedImage || !fabricCanvasRef.current) return;

    // 하이라이트 제거
    if (highlightedFrame) {
      const prevFrame = highlightedFrame as any;
      prevFrame.set({
        stroke: prevFrame._originalStroke || '#e0e0e0',
        strokeWidth: prevFrame._originalStrokeWidth || 2,
      });
      setHighlightedFrame(null);
    }

    const canvasWrapper = fabricCanvasRef.current.wrapperEl?.getBoundingClientRect();

    if (canvasWrapper) {
      const x = e.clientX - canvasWrapper.left;
      const y = e.clientY - canvasWrapper.top;

      // 드롭 위치에 프레임이 있는지 확인
      const frame = findFrameAtPosition(x, y);

      if (frame) {
        // 프레임에 이미지 클리핑
        await addImageToFrame(draggedImage, frame);
      } else {
        // 일반 이미지 추가
        addImageToCanvas(draggedImage, x, y);
      }
    } else {
      addImageToCanvas(draggedImage);
    }

    setDraggedImage(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';

    // 드래그 중 프레임 위에 있으면 하이라이트
    if (draggedImage && fabricCanvasRef.current) {
      const canvasWrapper = fabricCanvasRef.current.wrapperEl?.getBoundingClientRect();
      if (canvasWrapper) {
        const x = e.clientX - canvasWrapper.left;
        const y = e.clientY - canvasWrapper.top;
        const frame = findFrameAtPosition(x, y);

        if (frame !== highlightedFrame) {
          // 이전 하이라이트 제거
          if (highlightedFrame) {
            const prevFrame = highlightedFrame as any;
            prevFrame.set({
              stroke: prevFrame._originalStroke || '#e0e0e0',
              strokeWidth: prevFrame._originalStrokeWidth || 2,
            });
          }

          // 새 프레임 하이라이트
          if (frame) {
            const frameObj = frame as any;
            frameObj._originalStroke = frameObj.stroke;
            frameObj._originalStrokeWidth = frameObj.strokeWidth;
            frameObj.set({
              stroke: '#4AC1E0',
              strokeWidth: 4,
            });
          }

          setHighlightedFrame(frame);
          fabricCanvasRef.current.renderAll();
        }
      }
    }
  };

  // 드래그가 캔버스를 벗어났을 때
  const handleCanvasDragLeave = () => {
    if (highlightedFrame && fabricCanvasRef.current) {
      const prevFrame = highlightedFrame as any;
      prevFrame.set({
        stroke: prevFrame._originalStroke || '#e0e0e0',
        strokeWidth: prevFrame._originalStrokeWidth || 2,
      });
      setHighlightedFrame(null);
      fabricCanvasRef.current.renderAll();
    }
  };

  // 텍스트 추가
  const addText = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const text = new fabric.Textbox('텍스트를 입력하세요', {
      left: 100,
      top: 100,
      width: 300,
      fontSize: textOptions.fontSize,
      fontFamily: textOptions.fontFamily,
      fill: textOptions.fill,
      fontWeight: textOptions.fontWeight,
      fontStyle: textOptions.fontStyle,
      textAlign: textOptions.textAlign,
      editable: true,
    });

    fabricCanvasRef.current.add(text);
    fabricCanvasRef.current.setActiveObject(text);
    fabricCanvasRef.current.renderAll();
  }, [textOptions]);

  // 선택된 객체 삭제
  const deleteSelected = useCallback(() => {
    if (!fabricCanvasRef.current || !selectedObject) return;
    fabricCanvasRef.current.remove(selectedObject);
    setSelectedObject(null);
    fabricCanvasRef.current.renderAll();
  }, [selectedObject]);

  // 레이어 순서 변경
  const moveLayer = useCallback((direction: 'up' | 'down') => {
    if (!fabricCanvasRef.current || !selectedObject) return;
    if (direction === 'up') {
      fabricCanvasRef.current.bringObjectForward(selectedObject);
    } else {
      fabricCanvasRef.current.sendObjectBackwards(selectedObject);
    }
    fabricCanvasRef.current.renderAll();
  }, [selectedObject]);

  // 텍스트 스타일 업데이트
  const updateTextStyle = useCallback((property: string, value: any) => {
    if (!selectedObject || selectedObject.type !== 'textbox') return;
    selectedObject.set(property, value);
    setTextOptions(prev => ({ ...prev, [property]: value }));
    fabricCanvasRef.current?.renderAll();
  }, [selectedObject]);

  // 쿠팡 최적화 이미지 내보내기
  const exportImage = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const objects = fabricCanvasRef.current.getObjects();
    if (objects.length === 0) {
      alert('내보낼 내용이 없습니다.');
      return;
    }

    let maxBottom = 0;
    objects.forEach((obj: any) => {
      const bottom = obj.top + obj.getScaledHeight();
      if (bottom > maxBottom) maxBottom = bottom;
    });

    const padding = 20;
    const originalHeight = fabricCanvasRef.current.height;
    fabricCanvasRef.current.setHeight(maxBottom + padding);
    fabricCanvasRef.current.discardActiveObject();
    fabricCanvasRef.current.renderAll();

    const dataUrl = fabricCanvasRef.current.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 1,
    });

    fabricCanvasRef.current.setHeight(originalHeight);
    fabricCanvasRef.current.renderAll();

    if (onExport) {
      onExport(dataUrl);
    } else {
      const link = document.createElement('a');
      link.download = `detail-page-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }
  }, [onExport]);

  // 캔버스 초기화
  const resetCanvas = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    if (confirm('캔버스를 초기화하시겠습니까?')) {
      fabricCanvasRef.current.clear();
      fabricCanvasRef.current.backgroundColor = '#ffffff';
      setCanvasHeight(1000);
      fabricCanvasRef.current.setHeight(1000);
      fabricCanvasRef.current.renderAll();
      setSelectedObject(null);
    }
  }, []);

  // 캔버스 높이 조절
  const adjustCanvasHeight = (delta: number) => {
    const newHeight = Math.max(500, canvasHeight + delta);
    updateCanvasHeight(newHeight);
  };

  // 이미지 패널에서 이미지 제거
  const removeFromPanel = (index: number) => {
    setFolderImages(prev => prev.filter((_, i) => i !== index));
  };

  // 프레임 추가
  const addFrame = useCallback((frame: FrameTemplate) => {
    if (!fabricCanvasRef.current) return;

    let shape: fabric.FabricObject;
    const centerX = COUPANG_WIDTH / 2;
    const centerY = 200;

    switch (frame.type) {
      case 'circle':
        shape = new fabric.Circle({
          radius: frame.width / 2,
          left: centerX - frame.width / 2,
          top: centerY,
          fill: '#f5f5f5',
          stroke: '#e0e0e0',
          strokeWidth: 2,
        });
        break;
      case 'oval':
        shape = new fabric.Ellipse({
          rx: frame.width / 2,
          ry: frame.height / 2,
          left: centerX - frame.width / 2,
          top: centerY,
          fill: '#f5f5f5',
          stroke: '#e0e0e0',
          strokeWidth: 2,
        });
        break;
      case 'rounded':
        shape = new fabric.Rect({
          width: frame.width,
          height: frame.height,
          left: centerX - frame.width / 2,
          top: centerY,
          fill: '#f5f5f5',
          stroke: '#e0e0e0',
          strokeWidth: 2,
          rx: 30,
          ry: 30,
        });
        break;
      case 'wave':
        // 물결 모양 (수산물용)
        shape = new fabric.Rect({
          width: frame.width,
          height: frame.height,
          left: centerX - frame.width / 2,
          top: centerY,
          fill: '#e3f2fd',
          stroke: '#2196f3',
          strokeWidth: 3,
          rx: 20,
          ry: 20,
        });
        break;
      case 'leaf':
        // 나뭇잎 느낌 (농산물용)
        shape = new fabric.Ellipse({
          rx: frame.width / 2,
          ry: frame.height / 2.5,
          left: centerX - frame.width / 2,
          top: centerY,
          fill: '#e8f5e9',
          stroke: '#4caf50',
          strokeWidth: 3,
        });
        break;
      default:
        shape = new fabric.Rect({
          width: frame.width,
          height: frame.height,
          left: centerX - frame.width / 2,
          top: centerY,
          fill: '#f5f5f5',
          stroke: '#e0e0e0',
          strokeWidth: 2,
        });
    }

    // 프레임 식별을 위한 커스텀 속성
    (shape as any).isFrame = true;
    (shape as any).frameType = frame.type;

    fabricCanvasRef.current.add(shape);
    fabricCanvasRef.current.setActiveObject(shape);
    fabricCanvasRef.current.renderAll();
  }, []);

  // 뱃지 추가
  const addBadge = useCallback((badge: BadgeTemplate) => {
    if (!fabricCanvasRef.current) return;

    const badgeGroup: fabric.FabricObject[] = [];

    // 배경 둥근 사각형
    const bg = new fabric.Rect({
      width: 120,
      height: 36,
      fill: badge.bgColor,
      rx: 18,
      ry: 18,
    });
    badgeGroup.push(bg);

    // 텍스트
    const text = new fabric.Text(`${badge.icon || ''} ${badge.text}`, {
      fontSize: 14,
      fontFamily: 'Noto Sans KR, sans-serif',
      fill: badge.textColor,
      fontWeight: 'bold',
      left: 10,
      top: 10,
    });
    badgeGroup.push(text);

    // 그룹으로 묶기
    const group = new fabric.Group(badgeGroup, {
      left: 100,
      top: 100,
    });

    fabricCanvasRef.current.add(group);
    fabricCanvasRef.current.setActiveObject(group);
    fabricCanvasRef.current.renderAll();
  }, []);

  // 템플릿 추가
  const addTemplate = useCallback((template: ProductTemplate) => {
    if (!fabricCanvasRef.current) return;

    const elements: fabric.FabricObject[] = [];
    const centerX = COUPANG_WIDTH / 2;
    let currentY = 50;

    switch (template.id) {
      case 'product-intro':
        // 상품 소개 템플릿
        // 원형 이미지 프레임
        const introCircle = new fabric.Circle({
          radius: 150,
          left: centerX - 150,
          top: currentY,
          fill: '#f5f5f5',
          stroke: '#4caf50',
          strokeWidth: 4,
        });
        (introCircle as any).isFrame = true;
        elements.push(introCircle);
        currentY += 320;

        // 상품명
        const productName = new fabric.Textbox('상품명을 입력하세요', {
          left: 40,
          top: currentY,
          width: COUPANG_WIDTH - 80,
          fontSize: 32,
          fontFamily: 'Noto Sans KR, sans-serif',
          fontWeight: 'bold',
          fill: '#212121',
          textAlign: 'center',
        });
        elements.push(productName);
        currentY += 50;

        // 원산지
        const origin = new fabric.Textbox('🌿 원산지: 국내산', {
          left: 40,
          top: currentY,
          width: COUPANG_WIDTH - 80,
          fontSize: 18,
          fontFamily: 'Noto Sans KR, sans-serif',
          fill: '#4caf50',
          textAlign: 'center',
        });
        elements.push(origin);
        currentY += 35;

        // 중량
        const weight = new fabric.Textbox('📦 중량: 3kg (12~15과)', {
          left: 40,
          top: currentY,
          width: COUPANG_WIDTH - 80,
          fontSize: 16,
          fontFamily: 'Noto Sans KR, sans-serif',
          fill: '#757575',
          textAlign: 'center',
        });
        elements.push(weight);
        break;

      case 'fresh-badge':
        // 신선도 강조 템플릿
        // 산지직송 배너
        const banner = new fabric.Rect({
          left: 0,
          top: currentY,
          width: COUPANG_WIDTH,
          height: 60,
          fill: '#2e7d32',
        });
        elements.push(banner);

        const bannerText = new fabric.Text('🚚 산지직송 | 오늘 수확, 오늘 발송!', {
          left: centerX - 180,
          top: currentY + 18,
          fontSize: 20,
          fontFamily: 'Noto Sans KR, sans-serif',
          fontWeight: 'bold',
          fill: '#ffffff',
        });
        elements.push(bannerText);
        currentY += 80;

        // 이미지 프레임
        const freshFrame = new fabric.Rect({
          left: 40,
          top: currentY,
          width: COUPANG_WIDTH - 80,
          height: 400,
          fill: '#f1f8e9',
          stroke: '#8bc34a',
          strokeWidth: 3,
          rx: 20,
          ry: 20,
        });
        (freshFrame as any).isFrame = true;
        elements.push(freshFrame);
        break;

      case 'box-info':
        // 박스 구성 템플릿
        const boxTitle = new fabric.Text('📦 박스 구성 안내', {
          left: centerX - 100,
          top: currentY,
          fontSize: 24,
          fontFamily: 'Noto Sans KR, sans-serif',
          fontWeight: 'bold',
          fill: '#424242',
        });
        elements.push(boxTitle);
        currentY += 50;

        // 구성 정보 박스들
        const sizes = ['소과 (15~18과)', '중과 (12~14과)', '대과 (9~11과)'];
        sizes.forEach((size, i) => {
          const box = new fabric.Rect({
            left: 40 + (i * 235),
            top: currentY,
            width: 220,
            height: 120,
            fill: i === 1 ? '#fff3e0' : '#fafafa',
            stroke: i === 1 ? '#ff9800' : '#e0e0e0',
            strokeWidth: 2,
            rx: 10,
            ry: 10,
          });
          elements.push(box);

          const sizeText = new fabric.Text(size, {
            left: 60 + (i * 235),
            top: currentY + 45,
            fontSize: 16,
            fontFamily: 'Noto Sans KR, sans-serif',
            fontWeight: i === 1 ? 'bold' : 'normal',
            fill: '#424242',
          });
          elements.push(sizeText);
        });
        break;

      case 'origin-info':
        // 원산지 표시 템플릿
        const originBg = new fabric.Rect({
          left: 40,
          top: currentY,
          width: COUPANG_WIDTH - 80,
          height: 150,
          fill: '#e8f5e9',
          stroke: '#4caf50',
          strokeWidth: 2,
          rx: 15,
          ry: 15,
        });
        elements.push(originBg);

        const mapIcon = new fabric.Text('📍', {
          left: 80,
          top: currentY + 40,
          fontSize: 48,
        });
        elements.push(mapIcon);

        const originTitle = new fabric.Text('원산지', {
          left: 150,
          top: currentY + 35,
          fontSize: 16,
          fontFamily: 'Noto Sans KR, sans-serif',
          fill: '#757575',
        });
        elements.push(originTitle);

        const originValue = new fabric.Textbox('전남 해남', {
          left: 150,
          top: currentY + 60,
          width: 400,
          fontSize: 32,
          fontFamily: 'Noto Sans KR, sans-serif',
          fontWeight: 'bold',
          fill: '#2e7d32',
        });
        elements.push(originValue);
        break;
    }

    // 모든 요소 추가
    elements.forEach(el => fabricCanvasRef.current.add(el));
    fabricCanvasRef.current.renderAll();

    // 캔버스 높이 조정
    const lastEl = elements[elements.length - 1];
    if (lastEl) {
      const bottom = (lastEl.top || 0) + (lastEl.height || 0) + 100;
      if (bottom > canvasHeight) {
        updateCanvasHeight(bottom);
      }
    }
  }, [canvasHeight]);

  return (
    <div className="flex flex-col h-full">
      {/* 로딩 오버레이 */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-gray-100)] rounded-lg z-10">
          <div className="text-[var(--color-gray-500)]">에디터 로딩 중...</div>
        </div>
      )}

      {/* 상단 툴바 */}
      <div className={`bg-white border-b border-[var(--color-gray-300)] p-2 flex items-center gap-1 flex-wrap ${!isLoaded ? 'opacity-0' : ''}`}>
        {/* Undo/Redo */}
        <div className="flex items-center gap-1 pr-2 border-r border-[var(--color-gray-300)]">
          <Tooltip text="실행 취소" shortcut="Ctrl+Z">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-1.5 rounded-lg transition-colors disabled:opacity-40 hover:bg-[var(--color-gray-100)] text-[var(--color-gray-700)]"
            >
              <Undo2 size={18} />
            </button>
          </Tooltip>
          <Tooltip text="다시 실행" shortcut="Ctrl+Y">
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 rounded-lg transition-colors disabled:opacity-40 hover:bg-[var(--color-gray-100)] text-[var(--color-gray-700)]"
            >
              <Redo2 size={18} />
            </button>
          </Tooltip>
        </div>

        {/* 기본 도구 */}
        <div className="flex items-center gap-1 pr-2 border-r border-[var(--color-gray-300)]">
          <Tooltip text="텍스트 추가">
            <button
              onClick={addText}
              className="flex items-center gap-1 px-2 py-1.5 bg-[var(--color-primary-500)] text-white rounded-lg hover:bg-[var(--color-primary-600)] text-xs transition-colors"
            >
              <Type size={14} />
              텍스트
            </button>
          </Tooltip>
        </div>

        {/* 복사/붙여넣기 */}
        <div className="flex items-center gap-1 pr-2 border-r border-[var(--color-gray-300)]">
          <Tooltip text="복사" shortcut="Ctrl+C">
            <button
              onClick={copyObject}
              disabled={!selectedObject}
              className="p-1.5 rounded-lg transition-colors disabled:opacity-40 hover:bg-[var(--color-gray-100)] text-[var(--color-gray-700)]"
            >
              <Copy size={16} />
            </button>
          </Tooltip>
          <Tooltip text="붙여넣기" shortcut="Ctrl+V">
            <button
              onClick={pasteObject}
              disabled={!clipboard}
              className="p-1.5 rounded-lg transition-colors disabled:opacity-40 hover:bg-[var(--color-gray-100)] text-[var(--color-gray-700)]"
            >
              <Clipboard size={16} />
            </button>
          </Tooltip>
        </div>

        {/* 그룹 */}
        <div className="flex items-center gap-1 pr-2 border-r border-[var(--color-gray-300)]">
          <Tooltip text="그룹화" shortcut="Ctrl/Cmd+클릭으로 다중 선택 후">
            <button
              onClick={groupObjects}
              className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-gray-100)] text-[var(--color-gray-700)]"
            >
              <Group size={16} />
            </button>
          </Tooltip>
          <Tooltip text="그룹 해제">
            <button
              onClick={ungroupObjects}
              disabled={selectedObject?.type !== 'group'}
              className="p-1.5 rounded-lg transition-colors disabled:opacity-40 hover:bg-[var(--color-gray-100)] text-[var(--color-gray-700)]"
            >
              <Ungroup size={16} />
            </button>
          </Tooltip>
        </div>

        {/* 정렬 */}
        <div className="flex items-center gap-1 pr-2 border-r border-[var(--color-gray-300)]">
          <Tooltip text="가로 가운데 정렬">
            <button
              onClick={alignHorizontalCenter}
              disabled={!selectedObject}
              className="p-1.5 rounded-lg transition-colors disabled:opacity-40 hover:bg-[var(--color-gray-100)] text-[var(--color-gray-700)]"
            >
              <AlignHorizontalJustifyCenter size={16} />
            </button>
          </Tooltip>
          <Tooltip text="세로 가운데 정렬">
            <button
              onClick={alignVerticalCenter}
              disabled={!selectedObject}
              className="p-1.5 rounded-lg transition-colors disabled:opacity-40 hover:bg-[var(--color-gray-100)] text-[var(--color-gray-700)]"
            >
              <AlignVerticalJustifyCenter size={16} />
            </button>
          </Tooltip>
        </div>

        {/* 레이어 순서 */}
        <div className="flex items-center gap-1 pr-2 border-r border-[var(--color-gray-300)]">
          <Tooltip text="맨 앞으로">
            <button
              onClick={bringToFront}
              disabled={!selectedObject}
              className="p-1.5 rounded-lg transition-colors disabled:opacity-40 hover:bg-[var(--color-gray-100)] text-[var(--color-gray-700)]"
            >
              <ChevronsUp size={16} />
            </button>
          </Tooltip>
          <Tooltip text="앞으로">
            <button
              onClick={() => moveLayer('up')}
              disabled={!selectedObject}
              className="p-1.5 rounded-lg transition-colors disabled:opacity-40 hover:bg-[var(--color-gray-100)] text-[var(--color-gray-700)]"
            >
              <ChevronUp size={16} />
            </button>
          </Tooltip>
          <Tooltip text="뒤로">
            <button
              onClick={() => moveLayer('down')}
              disabled={!selectedObject}
              className="p-1.5 rounded-lg transition-colors disabled:opacity-40 hover:bg-[var(--color-gray-100)] text-[var(--color-gray-700)]"
            >
              <ChevronDown size={16} />
            </button>
          </Tooltip>
          <Tooltip text="맨 뒤로">
            <button
              onClick={sendToBack}
              disabled={!selectedObject}
              className="p-1.5 rounded-lg transition-colors disabled:opacity-40 hover:bg-[var(--color-gray-100)] text-[var(--color-gray-700)]"
            >
              <ChevronsDown size={16} />
            </button>
          </Tooltip>
        </div>

        {/* 삭제 */}
        <div className="flex items-center gap-1 pr-2 border-r border-[var(--color-gray-300)]">
          <Tooltip text="삭제" shortcut="Delete">
            <button
              onClick={deleteSelected}
              disabled={!selectedObject}
              className="p-1.5 rounded-lg transition-colors disabled:opacity-40 bg-red-50 text-[var(--color-danger)] hover:bg-red-100"
            >
              <Trash2 size={16} />
            </button>
          </Tooltip>
        </div>

        {/* 텍스트 옵션 (텍스트 선택 시) */}
        {selectedObject?.type === 'textbox' && (
          <div className="flex items-center gap-1 pr-2 border-r border-[var(--color-gray-300)]">
            <Tooltip text="글자 크기">
              <input
                type="number"
                value={textOptions.fontSize}
                onChange={(e) => updateTextStyle('fontSize', Number(e.target.value))}
                className="w-14 px-1.5 py-1 border border-[var(--color-gray-300)] rounded text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-500)]"
                min={8}
                max={120}
              />
            </Tooltip>
            <Tooltip text="글자 색상">
              <input
                type="color"
                value={textOptions.fill}
                onChange={(e) => updateTextStyle('fill', e.target.value)}
                className="w-7 h-7 cursor-pointer border border-[var(--color-gray-300)] rounded"
              />
            </Tooltip>
            <Tooltip text="굵게" shortcut="Ctrl+B">
              <button
                onClick={() => updateTextStyle('fontWeight', textOptions.fontWeight === 'bold' ? 'normal' : 'bold')}
                className={`p-1 rounded transition-colors ${textOptions.fontWeight === 'bold' ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-600)]' : 'hover:bg-[var(--color-gray-100)] text-[var(--color-gray-700)]'}`}
              >
                <Bold size={14} />
              </button>
            </Tooltip>
            <Tooltip text="기울임" shortcut="Ctrl+I">
              <button
                onClick={() => updateTextStyle('fontStyle', textOptions.fontStyle === 'italic' ? 'normal' : 'italic')}
                className={`p-1 rounded transition-colors ${textOptions.fontStyle === 'italic' ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-600)]' : 'hover:bg-[var(--color-gray-100)] text-[var(--color-gray-700)]'}`}
              >
                <Italic size={14} />
              </button>
            </Tooltip>
            <Tooltip text="왼쪽 정렬">
              <button
                onClick={() => updateTextStyle('textAlign', 'left')}
                className={`p-1 rounded transition-colors ${textOptions.textAlign === 'left' ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-600)]' : 'hover:bg-[var(--color-gray-100)] text-[var(--color-gray-700)]'}`}
              >
                <AlignLeft size={14} />
              </button>
            </Tooltip>
            <Tooltip text="가운데 정렬">
              <button
                onClick={() => updateTextStyle('textAlign', 'center')}
                className={`p-1 rounded transition-colors ${textOptions.textAlign === 'center' ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-600)]' : 'hover:bg-[var(--color-gray-100)] text-[var(--color-gray-700)]'}`}
              >
                <AlignCenter size={14} />
              </button>
            </Tooltip>
            <Tooltip text="오른쪽 정렬">
              <button
                onClick={() => updateTextStyle('textAlign', 'right')}
                className={`p-1 rounded transition-colors ${textOptions.textAlign === 'right' ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-600)]' : 'hover:bg-[var(--color-gray-100)] text-[var(--color-gray-700)]'}`}
              >
                <AlignRight size={14} />
              </button>
            </Tooltip>
          </div>
        )}

        {/* 캔버스 높이 */}
        <div className="flex items-center gap-1 pr-2 border-r border-[var(--color-gray-300)]">
          <span className="text-xs text-[var(--color-gray-500)]">높이</span>
          <Tooltip text="높이 줄이기">
            <button
              onClick={() => adjustCanvasHeight(-200)}
              className="p-1 bg-[var(--color-gray-100)] text-[var(--color-gray-700)] rounded hover:bg-[var(--color-gray-200)] transition-colors"
            >
              <Minus size={12} />
            </button>
          </Tooltip>
          <span className="text-xs text-[var(--color-gray-600)] w-12 text-center">{canvasHeight}px</span>
          <Tooltip text="높이 늘리기">
            <button
              onClick={() => adjustCanvasHeight(200)}
              className="p-1 bg-[var(--color-gray-100)] text-[var(--color-gray-700)] rounded hover:bg-[var(--color-gray-200)] transition-colors"
            >
              <Plus size={12} />
            </button>
          </Tooltip>
        </div>

        {/* 액션 버튼들 */}
        <div className="flex items-center gap-1 ml-auto">
          <Tooltip text="레이어 패널 토글">
            <button
              onClick={() => setShowRightPanel(!showRightPanel)}
              className={`p-1.5 rounded-lg transition-colors ${showRightPanel ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-600)]' : 'hover:bg-[var(--color-gray-100)] text-[var(--color-gray-700)]'}`}
            >
              <Layers size={16} />
            </button>
          </Tooltip>
          <Tooltip text="캔버스 초기화">
            <button
              onClick={resetCanvas}
              className="flex items-center gap-1 px-2 py-1.5 bg-[var(--color-gray-100)] text-[var(--color-gray-700)] rounded-lg hover:bg-[var(--color-gray-200)] text-xs transition-colors"
            >
              <RotateCcw size={14} />
              초기화
            </button>
          </Tooltip>
          <Tooltip text="이미지 내보내기">
            <button
              onClick={exportImage}
              className="flex items-center gap-1 px-2 py-1.5 bg-[var(--color-primary-500)] text-white rounded-lg hover:bg-[var(--color-primary-600)] text-xs transition-colors"
            >
              <Download size={14} />
              완료
            </button>
          </Tooltip>
        </div>
      </div>

      {/* 메인 영역: 이미지 패널 + 캔버스 */}
      <div className={`flex flex-1 overflow-hidden ${!isLoaded ? 'opacity-0' : ''}`}>
        {/* 왼쪽 패널 */}
        <div className="w-72 bg-white border-r border-[var(--color-gray-300)] flex flex-col">
          {/* 탭 네비게이션 */}
          <div className="flex border-b border-[var(--color-gray-300)]">
            <button
              onClick={() => setLeftPanelTab('images')}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors flex flex-col items-center gap-1 ${
                leftPanelTab === 'images'
                  ? 'text-[var(--color-primary-600)] border-b-2 border-[var(--color-primary-500)] bg-[var(--color-primary-50)]'
                  : 'text-[var(--color-gray-600)] hover:bg-[var(--color-gray-100)]'
              }`}
            >
              <Image size={18} />
              이미지
            </button>
            <button
              onClick={() => setLeftPanelTab('frames')}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors flex flex-col items-center gap-1 ${
                leftPanelTab === 'frames'
                  ? 'text-[var(--color-primary-600)] border-b-2 border-[var(--color-primary-500)] bg-[var(--color-primary-50)]'
                  : 'text-[var(--color-gray-600)] hover:bg-[var(--color-gray-100)]'
              }`}
            >
              <Frame size={18} />
              프레임
            </button>
            <button
              onClick={() => setLeftPanelTab('templates')}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors flex flex-col items-center gap-1 ${
                leftPanelTab === 'templates'
                  ? 'text-[var(--color-primary-600)] border-b-2 border-[var(--color-primary-500)] bg-[var(--color-primary-50)]'
                  : 'text-[var(--color-gray-600)] hover:bg-[var(--color-gray-100)]'
              }`}
            >
              <Layout size={18} />
              템플릿
            </button>
            <button
              onClick={() => setLeftPanelTab('badges')}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors flex flex-col items-center gap-1 ${
                leftPanelTab === 'badges'
                  ? 'text-[var(--color-primary-600)] border-b-2 border-[var(--color-primary-500)] bg-[var(--color-primary-50)]'
                  : 'text-[var(--color-gray-600)] hover:bg-[var(--color-gray-100)]'
              }`}
            >
              <Award size={18} />
              뱃지
            </button>
          </div>

          {/* 탭 콘텐츠 */}
          <div className="flex-1 overflow-y-auto">
            {/* 이미지 탭 */}
            {leftPanelTab === 'images' && (
              <div className="flex flex-col h-full">
                <div className="p-3 border-b border-[var(--color-gray-200)]">
                  <button
                    onClick={handleFolderSelect}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-primary-500)] text-white rounded-lg hover:bg-[var(--color-primary-600)] transition-colors"
                  >
                    <FolderOpen size={18} />
                    폴더 선택
                  </button>
                  <p className="text-xs text-[var(--color-gray-500)] mt-2 text-center">
                    이미지를 드래그하여 캔버스에 추가
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  {folderImages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-[var(--color-gray-400)] text-sm">
                      <Image size={48} className="mb-2 opacity-50" />
                      <p>폴더를 선택하면</p>
                      <p>이미지가 표시됩니다</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {folderImages.map((img, index) => (
                        <div
                          key={index}
                          className="relative group cursor-grab active:cursor-grabbing"
                          draggable
                          onDragStart={(e) => handleDragStart(e, img.dataUrl)}
                        >
                          <img
                            src={img.dataUrl}
                            alt={img.name}
                            className="w-full h-24 object-cover rounded-lg border border-[var(--color-gray-300)] hover:border-[var(--color-primary-500)] transition-colors"
                          />
                          <button
                            onClick={() => removeFromPanel(index)}
                            className="absolute top-1 right-1 p-0.5 bg-[var(--color-danger)] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            title="목록에서 제거"
                          >
                            <X size={12} />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate rounded-b-lg">
                            {img.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {folderImages.length > 0 && (
                  <div className="p-2 border-t border-[var(--color-gray-300)] text-xs text-[var(--color-gray-500)] text-center">
                    {folderImages.length}개 이미지
                  </div>
                )}
              </div>
            )}

            {/* 프레임 탭 */}
            {leftPanelTab === 'frames' && (
              <div className="p-3">
                <p className="text-xs text-[var(--color-gray-500)] mb-3">
                  프레임을 클릭하여 캔버스에 추가하세요
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {FRAMES.map((frame) => (
                    <button
                      key={frame.id}
                      onClick={() => addFrame(frame)}
                      className="p-4 border border-[var(--color-gray-300)] rounded-lg hover:border-[var(--color-primary-500)] hover:bg-[var(--color-primary-50)] transition-colors flex flex-col items-center gap-2"
                    >
                      <div className="text-[var(--color-gray-600)]">
                        {frame.icon}
                      </div>
                      <span className="text-xs text-[var(--color-gray-700)]">{frame.name}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-[var(--color-gray-100)] rounded-lg">
                  <p className="text-xs text-[var(--color-gray-600)]">
                    💡 <strong>팁:</strong> 프레임 위에 이미지를 드래그하면 프레임 안에 이미지가 들어갑니다
                  </p>
                </div>
              </div>
            )}

            {/* 템플릿 탭 */}
            {leftPanelTab === 'templates' && (
              <div className="p-3">
                <p className="text-xs text-[var(--color-gray-500)] mb-3">
                  농수산물 상세페이지 템플릿
                </p>
                <div className="space-y-2">
                  {TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => addTemplate(template)}
                      className="w-full p-3 border border-[var(--color-gray-300)] rounded-lg hover:border-[var(--color-primary-500)] hover:bg-[var(--color-primary-50)] transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {template.category === 'intro' && <Apple size={16} className="text-green-600" />}
                        {template.category === 'fresh' && <Truck size={16} className="text-green-600" />}
                        {template.category === 'info' && <Layout size={16} className="text-orange-600" />}
                        {template.category === 'origin' && <MapPin size={16} className="text-green-600" />}
                        <span className="text-sm font-medium text-[var(--color-gray-800)]">{template.name}</span>
                      </div>
                      <p className="text-xs text-[var(--color-gray-500)] ml-6">{template.preview}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 뱃지 탭 */}
            {leftPanelTab === 'badges' && (
              <div className="p-3">
                <p className="text-xs text-[var(--color-gray-500)] mb-3">
                  클릭하여 뱃지 추가
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {BADGES.map((badge) => (
                    <button
                      key={badge.id}
                      onClick={() => addBadge(badge)}
                      className="px-3 py-2 rounded-full text-xs font-bold transition-transform hover:scale-105"
                      style={{ backgroundColor: badge.bgColor, color: badge.textColor }}
                    >
                      {badge.icon} {badge.text}
                    </button>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-[var(--color-gray-100)] rounded-lg">
                  <p className="text-xs text-[var(--color-gray-600)]">
                    💡 뱃지를 추가한 후 자유롭게 이동하고 크기를 조절할 수 있습니다
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 캔버스 영역 */}
        <div
          className="flex-1 bg-[var(--background)] p-4 overflow-auto"
          onDrop={handleCanvasDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleCanvasDragLeave}
        >
          <div className="inline-block border-2 border-dashed border-[var(--color-gray-300)] bg-white rounded-lg shadow-sm">
            <canvas ref={canvasRef} />
          </div>
        </div>

        {/* 오른쪽 레이어 패널 */}
        {showRightPanel && (
          <div className="w-56 bg-white border-l border-[var(--color-gray-300)] flex flex-col">
            <div className="p-3 border-b border-[var(--color-gray-300)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-[var(--color-gray-600)]" />
                <span className="text-sm font-medium text-[var(--color-gray-800)]">레이어</span>
              </div>
              <span className="text-xs text-[var(--color-gray-500)]">{layers.length}개</span>
            </div>

            <div className="flex-1 overflow-y-auto">
              {layers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[var(--color-gray-400)] text-xs p-4">
                  <Layers size={32} className="mb-2 opacity-50" />
                  <p>레이어가 없습니다</p>
                  <p className="mt-1">객체를 추가하면</p>
                  <p>여기에 표시됩니다</p>
                </div>
              ) : (
                <div className="p-1">
                  {layers.map((layer) => {
                    // 다중 선택 시 해당 레이어가 선택되었는지 확인
                    const isSelected = (() => {
                      if (!selectedObject) return false;
                      if ((selectedObject as any)._customId === layer.id) return true;
                      // Fabric.js 6에서는 type이 소문자일 수 있음
                      const isActiveSelection = selectedObject.type === 'activeSelection' ||
                        selectedObject.type === 'activeselection' ||
                        selectedObject instanceof fabric.ActiveSelection;
                      if (isActiveSelection) {
                        const objects = (selectedObject as fabric.ActiveSelection).getObjects();
                        return objects.some((obj: any) => obj._customId === layer.id);
                      }
                      return false;
                    })();

                    return (
                      <div
                        key={layer.id}
                        draggable={!layer.locked && editingLayerId !== layer.id}
                        onDragStart={(e) => handleLayerDragStart(e, layer.id)}
                        onDragOver={(e) => handleLayerDragOver(e, layer.id)}
                        onDragLeave={handleLayerDragLeave}
                        onDrop={(e) => handleLayerDrop(e, layer.id)}
                        onDragEnd={handleLayerDragEnd}
                        onClick={(e) => selectLayer(layer.id, e)}
                        className={`flex items-center gap-1 p-2 rounded-lg cursor-pointer mb-1 transition-all ${
                          isSelected
                            ? 'bg-[var(--color-primary-50)] border border-[var(--color-primary-300)]'
                            : 'hover:bg-[var(--color-gray-100)] border border-transparent'
                        } ${layer.locked ? 'opacity-60' : ''} ${
                          draggedLayerId === layer.id ? 'opacity-50 scale-95' : ''
                        } ${
                          dragOverLayerId === layer.id && draggedLayerId !== layer.id
                            ? 'border-t-2 border-t-[var(--color-primary-500)]'
                            : ''
                        }`}
                      >
                        {/* 드래그 핸들 */}
                        <GripVertical
                          size={12}
                          className={`flex-shrink-0 text-[var(--color-gray-400)] ${layer.locked ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
                        />

                        {/* 타입 아이콘 */}
                        <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center text-[var(--color-gray-500)]">
                          {layer.type === 'image' && <Image size={12} />}
                          {(layer.type === 'textbox' || layer.type === 'text') && <Type size={12} />}
                          {layer.type === 'circle' && <div className="w-3 h-3 rounded-full border border-current" />}
                          {layer.type === 'rect' && <div className="w-3 h-3 rounded-sm border border-current" />}
                          {layer.type === 'ellipse' && <div className="w-4 h-2.5 rounded-full border border-current" />}
                          {layer.type === 'group' && <Group size={12} />}
                        </div>

                        {/* 레이어 이름 (편집 가능) */}
                        {editingLayerId === layer.id ? (
                          <input
                            type="text"
                            value={editingLayerName}
                            onChange={(e) => setEditingLayerName(e.target.value)}
                            onBlur={finishEditingLayerName}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                finishEditingLayerName();
                              } else if (e.key === 'Escape') {
                                cancelEditingLayerName();
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                            className="flex-1 min-w-0 text-xs px-1 py-0.5 border border-[var(--color-primary-300)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-500)]"
                          />
                        ) : (
                          <span
                            className="flex-1 min-w-0 text-xs truncate text-[var(--color-gray-700)] cursor-text"
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              startEditingLayerName(layer.id, layer.name);
                            }}
                            title="더블클릭하여 이름 변경"
                          >
                            {layer.name}
                          </span>
                        )}

                        {/* 가시성 토글 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLayerVisibility(layer.id);
                          }}
                          className="flex-shrink-0 p-1 rounded hover:bg-[var(--color-gray-200)] text-[var(--color-gray-500)]"
                          title={layer.visible ? '숨기기' : '보이기'}
                        >
                          {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                        </button>

                        {/* 잠금 토글 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLayerLock(layer.id);
                          }}
                          className="flex-shrink-0 p-1 rounded hover:bg-[var(--color-gray-200)] text-[var(--color-gray-500)]"
                          title={layer.locked ? '잠금 해제' : '잠금'}
                        >
                          {layer.locked ? <Lock size={12} /> : <Unlock size={12} />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 레이어 패널 하단 도움말 */}
            <div className="p-2 border-t border-[var(--color-gray-200)] bg-[var(--color-gray-50)]">
              <p className="text-[10px] text-[var(--color-gray-500)] leading-relaxed">
                💡 Ctrl/Cmd+클릭으로 다중 선택<br />
                💡 더블클릭으로 이름 변경
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
