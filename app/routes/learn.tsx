import { Player } from '@remotion/player';
import React, { useCallback, useMemo, useState } from 'react';
import { AbsoluteFill, Sequence, useCurrentScale } from 'remotion';

export type Item = {
  id: number;
  durationInFrames: number;
  from: number;
  height: number;
  left: number;
  top: number;
  width: number;
  color: string;
  isDragging: boolean;
};

export const Layer: React.FC<{
  item: Item;
}> = ({ item }) => {
  const style: React.CSSProperties = useMemo(() => {
    return {
      backgroundColor: item.color,
      position: 'absolute',
      left: item.left,
      top: item.top,
      width: item.width,
      height: item.height,
    };
  }, [item.color, item.height, item.left, item.top, item.width]);

  return (
    <Sequence
      key={item.id}
      from={item.from}
      durationInFrames={item.durationInFrames}
      layout="none"
    >
      <div style={style} />
    </Sequence>
  );
};

const HANDLE_SIZE = 10;

export const ResizeHandle: React.FC<{
  type: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  setItem: (itemId: number, updater: (item: Item) => Item) => void;
  item: Item;
}> = ({ type, setItem, item }) => {
  const scale = useCurrentScale();
  const size = Math.round(HANDLE_SIZE / scale);
  const borderSize = 1 / scale;

  const sizeStyle: React.CSSProperties = useMemo(() => {
    return {
      position: 'absolute',
      height: size,
      width: size,
      backgroundColor: 'white',
      border: `${borderSize}px solid #0B84F3`,
    };
  }, [borderSize, size]);

  const margin = -size / 2 - borderSize;

  const style: React.CSSProperties = useMemo(() => {
    if (type === 'top-left') {
      return {
        ...sizeStyle,
        marginLeft: margin,
        marginTop: margin,
        cursor: 'nwse-resize',
      };
    }

    if (type === 'top-right') {
      return {
        ...sizeStyle,
        marginTop: margin,
        marginRight: margin,
        right: 0,
        cursor: 'nesw-resize',
      };
    }

    if (type === 'bottom-left') {
      return {
        ...sizeStyle,
        marginBottom: margin,
        marginLeft: margin,
        bottom: 0,
        cursor: 'nesw-resize',
      };
    }

    if (type === 'bottom-right') {
      return {
        ...sizeStyle,
        marginBottom: margin,
        marginRight: margin,
        right: 0,
        bottom: 0,
        cursor: 'nwse-resize',
      };
    }

    throw new Error('Unknown type: ' + JSON.stringify(type));
  }, [margin, sizeStyle, type]);

  const onPointerDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (e.button !== 0) {
        return;
      }

      const initialX = e.clientX;
      const initialY = e.clientY;

      const onPointerMove = (pointerMoveEvent: PointerEvent) => {
        const offsetX = (pointerMoveEvent.clientX - initialX) / scale;
        const offsetY = (pointerMoveEvent.clientY - initialY) / scale;

        const isLeft = type === 'top-left' || type === 'bottom-left';
        const isTop = type === 'top-left' || type === 'top-right';

        setItem(item.id, (i) => {
          const newWidth = item.width + (isLeft ? -offsetX : offsetX);
          const newHeight = item.height + (isTop ? -offsetY : offsetY);
          const newLeft = item.left + (isLeft ? offsetX : 0);
          const newTop = item.top + (isTop ? offsetY : 0);

          return {
            ...i,
            width: Math.max(1, Math.round(newWidth)),
            height: Math.max(1, Math.round(newHeight)),
            left: Math.min(item.left + item.width - 1, Math.round(newLeft)),
            top: Math.min(item.top + item.height - 1, Math.round(newTop)),
            isDragging: true,
          };
        });
      };

      const onPointerUp = () => {
        setItem(item.id, (i) => {
          return {
            ...i,
            isDragging: false,
          };
        });
        window.removeEventListener('pointermove', onPointerMove);
      };

      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerup', onPointerUp, {
        once: true,
      });
    },
    [item, scale, setItem, type],
  );

  return <div onPointerDown={onPointerDown} style={style} />;
};

export const SelectionOutline: React.FC<{
  item: Item;
  changeItem: (itemId: number, updater: (item: Item) => Item) => void;
  setSelectedItem: React.Dispatch<React.SetStateAction<number | null>>;
  selectedItem: number | null;
  isDragging: boolean;
}> = ({ item, changeItem, setSelectedItem, selectedItem, isDragging }) => {
  const scale = useCurrentScale();
  const scaledBorder = Math.ceil(2 / scale);

  const [hovered, setHovered] = React.useState(false);

  const onMouseEnter = useCallback(() => {
    setHovered(true);
  }, []);

  const onMouseLeave = useCallback(() => {
    setHovered(false);
  }, []);

  const isSelected = item.id === selectedItem;

  const style: React.CSSProperties = useMemo(() => {
    return {
      width: item.width,
      height: item.height,
      left: item.left,
      top: item.top,
      position: 'absolute',
      outline:
        (hovered && !isDragging) || isSelected
          ? `${scaledBorder}px solid #0B84F3`
          : undefined,
      userSelect: 'none',
      touchAction: 'none',
    };
  }, [item, hovered, isDragging, isSelected, scaledBorder]);

  const startDragging = useCallback(
    (e: PointerEvent | React.MouseEvent) => {
      const initialX = e.clientX;
      const initialY = e.clientY;

      const onPointerMove = (pointerMoveEvent: PointerEvent) => {
        const offsetX = (pointerMoveEvent.clientX - initialX) / scale;
        const offsetY = (pointerMoveEvent.clientY - initialY) / scale;
        changeItem(item.id, (i) => {
          return {
            ...i,
            left: Math.round(item.left + offsetX),
            top: Math.round(item.top + offsetY),
            isDragging: true,
          };
        });
      };

      const onPointerUp = () => {
        changeItem(item.id, (i) => {
          return {
            ...i,
            isDragging: false,
          };
        });
        window.removeEventListener('pointermove', onPointerMove);
      };

      window.addEventListener('pointermove', onPointerMove, { passive: true });

      window.addEventListener('pointerup', onPointerUp, {
        once: true,
      });
    },
    [item, scale, changeItem],
  );

  const onPointerDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (e.button !== 0) {
        return;
      }

      setSelectedItem(item.id);
      startDragging(e);
    },
    [item.id, setSelectedItem, startDragging],
  );

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerEnter={onMouseEnter}
      onPointerLeave={onMouseLeave}
      style={style}
    >
      {isSelected ? (
        <>
          <ResizeHandle item={item} setItem={changeItem} type="top-left" />
          <ResizeHandle item={item} setItem={changeItem} type="top-right" />
          <ResizeHandle item={item} setItem={changeItem} type="bottom-left" />
          <ResizeHandle item={item} setItem={changeItem} type="bottom-right" />
        </>
      ) : null}
    </div>
  );
};

const displaySelectedItemOnTop = (
  items: Item[],
  selectedItem: number | null,
): Item[] => {
  const selectedItems = items.filter((item) => item.id === selectedItem);
  const unselectedItems = items.filter((item) => item.id !== selectedItem);

  return [...unselectedItems, ...selectedItems];
};

export const SortedOutlines: React.FC<{
  items: Item[];
  selectedItem: number | null;
  changeItem: (itemId: number, updater: (item: Item) => Item) => void;
  setSelectedItem: React.Dispatch<React.SetStateAction<number | null>>;
}> = ({ items, selectedItem, changeItem, setSelectedItem }) => {
  const itemsToDisplay = React.useMemo(
    () => displaySelectedItemOnTop(items, selectedItem),
    [items, selectedItem],
  );

  const isDragging = React.useMemo(
    () => items.some((item) => item.isDragging),
    [items],
  );

  return itemsToDisplay.map((item) => {
    return (
      <Sequence
        key={item.id}
        from={item.from}
        durationInFrames={item.durationInFrames}
        layout="none"
      >
        <SelectionOutline
          changeItem={changeItem}
          item={item}
          setSelectedItem={setSelectedItem}
          selectedItem={selectedItem}
          isDragging={isDragging}
        />
      </Sequence>
    );
  });
};

export type MainProps = {
  readonly items: Item[];
  readonly setSelectedItem: React.Dispatch<React.SetStateAction<number | null>>;
  readonly selectedItem: number | null;
  readonly changeItem: (itemId: number, updater: (item: Item) => Item) => void;
};

const outer: React.CSSProperties = {
  backgroundColor: '#eee',
};

const layerContainer: React.CSSProperties = {
  overflow: 'hidden',
};

export function Main({
  items,
  setSelectedItem,
  selectedItem,
  changeItem,
}: MainProps) {
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) {
        return;
      }

      setSelectedItem(null);
    },
    [setSelectedItem],
  );

  return (
    <AbsoluteFill style={outer} onPointerDown={onPointerDown}>
      <AbsoluteFill style={layerContainer}>
        {items.map((item) => {
          return <Layer key={item.id} item={item} />;
        })}
      </AbsoluteFill>
      <SortedOutlines
        selectedItem={selectedItem}
        items={items}
        setSelectedItem={setSelectedItem}
        changeItem={changeItem}
      />
    </AbsoluteFill>
  );
};


export default function Learn() {
  const [items, setItems] = useState<Item[]>([
    {
      left: 395,
      top: 270,
      width: 540,
      durationInFrames: 100,
      from: 0,
      height: 540,
      id: 0,
      color: '#ccc',
      isDragging: false,
    },
    {
      left: 985,
      top: 270,
      width: 540,
      durationInFrames: 100,
      from: 0,
      height: 540,
      id: 1,
      color: '#ccc',
      isDragging: false,
    },
  ]);
  const [selectedItem, setSelectedItem] = useState<number | null>(null);

  const changeItem = useCallback(
    (itemId: number, updater: (item: Item) => Item) => {
      setItems((oldItems) => {
        return oldItems.map((item) => {
          if (item.id === itemId) {
            return updater(item);
          }

          return item;
        });
      });
    },
    [],
  );

  const inputProps: MainProps = useMemo(() => {
    return {
      items,
      setSelectedItem,
      changeItem,
      selectedItem,
    };
  }, [changeItem, items, selectedItem]);

  return (
    <Player
      style={{
        width: '100%',
      }}
      component={Main}
      compositionHeight={1080}
      compositionWidth={1920}
      durationInFrames={300}
      fps={30}
      inputProps={inputProps}
      overflowVisible
    />
  );
};