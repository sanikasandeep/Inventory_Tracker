'use client'
import Image from "next/image";
import { useState, useEffect } from 'react'
import { firestore } from '@/firebase'
import { Box, Stack, Typography, Button, Modal, TextField } from '@mui/material'
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore'
import { async } from "@firebase/util";

export default function Home() {
  const [inventory, setInventory] = useState([]) 
  const [open, setOpen] = useState(false)
  const [itemName, setItemName] = useState('')
  const [searchQuery, setSearchQuery] = useState('') 
  const [filteredInventory, setFilteredInventory] = useState([])
  const [searchResult, setSearchResult] = useState(null)

  const updateInventory = async() => {
    const snapshot = query(collection(firestore, 'inventory'))
    const docs = await getDocs(snapshot)
    const inventoryList = []
    docs.forEach((doc) => {
      inventoryList.push({ name: doc.id, ...doc.data(), })
    })
    setInventory(inventoryList)
  }

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const { quantity } = docSnap.data()
      if (quantity === 1) {
        await deleteDoc(docRef)
      } else {
        await setDoc(docRef, { quantity: quantity - 1 })
      } 
      await updateInventory()
    }
  }
  const addItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const { quantity } = docSnap.data()
      await setDoc(docRef, { quantity: quantity + 1 })
    } else {
      await setDoc(docRef, { quantity: 1 })
    }
    await updateInventory()
  }

  useEffect(() => {
    updateInventory()
  }, [])

  /*useEffect(() => {
    const filtered = inventory.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredInventory(filtered);
  }, [searchQuery, inventory]);*/

  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)
  const handleSearch = () => {
    const foundItem = inventory.find(item => 
      item.name.toLowerCase() === searchQuery.toLowerCase()
    );
    if (foundItem) {
      setSearchResult(foundItem.quantity);
    } else {
      setSearchResult(0);
    }
  }

  return (
    <Box width="100vw" height="100vh" display="flex" flexDirection="column" justifyContent="center" alignItems="center" gap={2}>
      <Modal open={open} onClose={handleClose}>
        <Box position="absolute" top="50%" left="50%" sx={{transform: "translate(-50%, -50%)"}} width={(400)} bgcolor="white" border="2px solid #000" boxSahdow={24} p={4} display="flex" flexDirection="column" gap={3}>
          <Typography variant="h6">Add Item</Typography>
          <Stack width="100%" direction="row" spacing={2}>
            <TextField variant='outlined' fullWidth value={itemName} onChange={(e) => {setItemName(e.target.value)}}></TextField>
            <Button variant="outlined" onClick={() => { 
              addItem(itemName) 
              setItemName('') 
              handleClose()}}>Add</Button>
          </Stack>
        </Box> 
      </Modal>
      <Button variant="contained" onClick={() => {
        handleOpen()
      }}>Add New Item</Button>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <TextField 
          variant="outlined" 
          placeholder="Search item..." 
          fullWidth 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button variant="contained" onClick={handleSearch}>Search</Button>
      </Stack>
      {searchResult !== null && (
        <Typography variant="h6" color="#333">
          Quantity: {searchResult}
        </Typography>
      )}
      <Box border="1px solid #333">
        <Box width="800px" height="100px" bgcolor="#ADD8E6" display="flex" alignItems="center" justifyContent="center">
          <Typography variant='h2' color="#333" textAlign="center">Inventory Items</Typography>
        </Box>
      <Stack width="800px" height="300px" spacing={2} overflow={'auto'} >
       {inventory.map(({name, quantity}) => (
          <Box
            key={name}
            width="100%"
            minHeight="150px"
            display={'flex'}
            justifyContent={'space-between'}
            alignItems={'center'}
            bgcolor={'#f0f0f0'}
            paddingX={5}
          >
            <Typography variant={'h3'} color={'#313F57'} textAlign={'center'}>
              {name.charAt(0).toUpperCase() + name.slice(1)}
            </Typography>
            <Typography variant={'h3'} color={'#313F57'} textAlign={'center'}>
              Quantity: {quantity}
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button variant="contained" onClick={() => addItem(name)}>
                Add
              </Button>
              <Button variant="contained" onClick={() => removeItem(name)}>
                Remove
              </Button>
            </Stack>
          </Box>
        ))}
      </Stack>
      </Box>
    </Box>
  )
}

