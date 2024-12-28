import { useState } from "react";

export function useList<T>(initialList: T[]) {
  const [list, setList] = useState(() => [...initialList]);

  function set(newList: T[]) {
    setList([...newList]);
  }

  function add(item: T) {
    setList((prevList: T[]) => [...prevList, item]);
  }

  function setValueAt(index: number, value: T) {
    setList((prevList: T[]) => {
      const newList = [...prevList];
      newList[index] = value;
      return newList;
    });
  }

  function removeAt(index: number) {
    setList((prevList: T[]) => {
      const newList = [...prevList];
      newList.splice(index, 1);
      return newList;
    });
  }

  function clear() {
    setList([]);
  }

  return {
    list,
    set,
    add,
    removeAt,
    setValueAt,
    clear,
  };
}
