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
  const [recipe, setRecipe] = useState('')  // New state to store generated recipe
  const [loadingRecipe, setLoadingRecipe] = useState(false)
  const isBrowser = () => typeof window !== "undefined";

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
  const generateRecipes = async () => {
    if (typeof window !== "undefined") {
      const availableIngredients = inventory.filter(item => item.quantity > 0).map(item => item.name);
      setLoadingRecipe(true); 
      try {
        const response = await fetch('/api/chat', {  // Call the backend API to generate recipes
          method: 'POST',
          headers: {
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ingredients: availableIngredients }),  // Send ingredients list
        });
  
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        let result = '';
  
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          result += decoder.decode(value);
        }
        const cleanedRecipe = result.replace(/#+/g, '').trim();
        setRecipe(cleanedRecipe);  // Set the generated recipe
  
      } catch (error) {
        console.error('Error generating recipe:', error);
        setRecipe('Failed to generate recipe. Please try again.');
      } finally {
        setLoadingRecipe(false);  // Stop loading state
      }
    }
  };

  return (
    <Box width="100vw" height="100vh" minHeight="100vh" overflow={'auto'} display="flex" flexDirection="column" justifyContent="center" alignItems="center" gap={2} bgcolor="#D3DA9A" >
      <Box flex="0 0 auto" padding={2} bgcolor="#FFFFFF" borderBottom="1px solid #ddd" display="flex" flexDirection="column" alignItems="center" gap={2} boxShadow="0 4px 12px rgba(0, 0, 0, 0.1)">
      <Modal open={open} onClose={handleClose}>
        <Box position="absolute" top="50%" left="50%" sx={{transform: "translate(-50%, -50%)"}} width={(400)} bgcolor="#FFFFFF" border="2px solid #AAB071" boxShadow={24} p={4} display="flex" flexDirection="column" gap={3}>
          <Typography variant="h6" color="#3D3D3D" fontWeight="bold">Add Item</Typography>
          <Stack width="100%" direction="row" spacing={2}>
            <TextField variant='outlined' fullWidth value={itemName} onChange={(e) => {setItemName(e.target.value)}}></TextField>
            <Button variant="outlined" sx={{
                bgcolor: "#3D3D3D", 
                color: "#FFFFFF",
                '&:hover': {
                  bgcolor: "#555555", 
                },
              }} onClick={() => { 
              addItem(itemName) 
              setItemName('') 
              handleClose()}}>Add</Button>
          </Stack>
        </Box> 
      </Modal>
      <Button variant="contained" sx={{
          bgcolor: "#3D3D3D", 
          color: "#FFFFFF",
          '&:hover': {
            bgcolor: "#555555",  // Button hover effect
          },
        }} onClick={() => {
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
        <Button variant="contained"
          sx={{
            bgcolor: "#3D3D3D", 
            color: "#FFFFFF",
            '&:hover': {
              bgcolor: "#555555",
            },
          }} onClick={handleSearch}>Search</Button>
      </Stack>
      {searchResult !== null && (
        <Typography variant="h6" color="#2D2D2D">
          Quantity: {searchResult}
        </Typography>
      )}
      </Box>
      <Box border="1px solid #333">
        <Box width="800px" height="100px" bgcolor="#AAB071" display="flex" alignItems="center" justifyContent="center">
          <Typography variant='h2' color="#FFFFFF" textAlign="center">Inventory Items</Typography>
        </Box>
      <Stack width="800px" height="300px" spacing={2} overflow={'auto'} sx={{
        '&::-webkit-scrollbar': {
          width: '10px', 
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#FFFFFF', 
          borderRadius: '10px',
          border: '2px solid #AAB071',
        },
        '&::-webkit-scrollbar-track': {
          background: '#D3DA9A', 
        },
      }}>
       {inventory.map(({name, quantity}) => (
          <Box
            key={name}
            width="100%"
            minHeight="150px"
            display={'flex'}
            justifyContent={'space-between'}
            alignItems={'center'}
            bgcolor={'#FFFFFF'}
            boxShadow="0 2px 8px rgba(0, 0, 0, 0.1)"
            paddingX={5}
          >
            <Typography variant={'h3'} color="#2D2D2D" textAlign={'center'}>
              {name.charAt(0).toUpperCase() + name.slice(1)}
            </Typography>
            <Typography variant={'h3'} color="#2D2D2D" textAlign={'center'}>
              Quantity: {quantity}
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button variant="contained" sx={{
                    bgcolor: "#3D3D3D", 
                    color: "#FFFFFF",
                    '&:hover': {
                      bgcolor: "#555555",
                    },
                  }} onClick={() => addItem(name)}>
                Add
              </Button>
              <Button variant="contained" sx={{
                    bgcolor: "#3D3D3D", 
                    color: "#FFFFFF",
                    '&:hover': {
                      bgcolor: "#555555",
                    },
                  }} onClick={() => removeItem(name)}>
                Remove
              </Button>
            </Stack>
          </Box>
        ))}
      </Stack>
      </Box>
         {/* Recipe Generator Section */}
      <Button variant="contained" sx={{
          bgcolor: "#3D3D3D", 
          color: "#FFFFFF",
          '&:hover': {
            bgcolor: "#555555",
          },
        }} onClick={generateRecipes} disabled={loadingRecipe}>
        {loadingRecipe ? 'Generating Recipe...' : 'Generate Recipe'}
      </Button>
      {recipe && (
        <Box mt={4} p={2} bgcolor={'#FFFFFF'} width="800px" borderRadius={2} boxShadow="0 4px 12px rgba(0, 0, 0, 0.1)">
          <Typography variant="h4" color="#2D2D2D" textAlign="center">Generated Recipe</Typography>
          <Typography variant="body1" color="#666666" mt={2}>{recipe}</Typography>
        </Box>
      )}
    </Box>
  )
}

